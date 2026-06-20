using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Text;
using System.Xml.Linq;

namespace ECari.Infrastructure.Integrations.Edm;

public class EdmSessionManager(EdmSoapClient soapClient)
{
    private readonly ConcurrentDictionary<string, SessionEntry> _sessions = new();
    private static readonly TimeSpan SessionLifetime = TimeSpan.FromMinutes(25);

    public async Task<string> GetSessionAsync(
        string cacheKey,
        string serviceUrl,
        string username,
        string password,
        CancellationToken ct,
        string soapInterface = "IEFaturaEDM")
    {
        if (_sessions.TryGetValue(cacheKey, out var existing)
            && existing.ExpiresAt > DateTime.UtcNow
            && !string.IsNullOrWhiteSpace(existing.SessionId))
        {
            return existing.SessionId;
        }

        var sessionId = await soapClient.LoginAsync(serviceUrl, username, password, ct, soapInterface);
        _sessions[cacheKey] = new SessionEntry(sessionId, DateTime.UtcNow.Add(SessionLifetime));
        return sessionId;
    }

    public void Invalidate(string cacheKey) => _sessions.TryRemove(cacheKey, out _);

    private sealed record SessionEntry(string SessionId, DateTime ExpiresAt);
}

public class EdmSoapClient(
    HttpClient httpClient,
    EdmRequestHeaderBuilder headerBuilder)
{
    private static readonly XNamespace Soap = "http://schemas.xmlsoap.org/soap/envelope/";
    private static readonly XNamespace Tem = "http://tempuri.org/";

    public async Task<string> LoginAsync(
        string serviceUrl,
        string username,
        string password,
        CancellationToken ct,
        string soapInterface = "IEFaturaEDM")
    {
        var body = new XElement(Tem + "LoginRequest",
            headerBuilder.Build("0"),
            new XElement(Tem + "USER_NAME", username),
            new XElement(Tem + "PASSWORD", password));

        var response = await PostAsync(serviceUrl, "Login", soapInterface, body, ct);
        var sessionId = FindValue(response, "SESSION_ID");
        if (string.IsNullOrWhiteSpace(sessionId))
            throw new InvalidOperationException("EDM Login yanıtında SESSION_ID bulunamadı.");

        return sessionId;
    }

    public async Task<IReadOnlyList<EdmGibUser>> CheckUserAsync(
        string serviceUrl,
        string sessionId,
        string identifier,
        CancellationToken ct)
    {
        var body = new XElement(Tem + "CheckUserRequest",
            headerBuilder.Build(sessionId),
            new XElement(Tem + "USER",
                new XElement(Tem + "IDENTIFIER", identifier)));

        var response = await PostAsync(serviceUrl, "CheckUser", "IEFaturaEDM", body, ct);
        var users = new List<EdmGibUser>();

        foreach (var userNode in response.Descendants(Tem + "USER"))
        {
            users.Add(new EdmGibUser(
                userNode.Element(Tem + "IDENTIFIER")?.Value,
                userNode.Element(Tem + "ALIAS")?.Value,
                userNode.Element(Tem + "TITLE")?.Value,
                userNode.Element(Tem + "TYPE")?.Value));
        }

        return users;
    }

    public async Task<EdmSendResult> SendInvoiceAsync(
        string serviceUrl,
        string sessionId,
        EdmInvoicePayload invoice,
        CancellationToken ct)
    {
        var invoiceNode = new XElement(Tem + "INVOICE",
            new XElement(Tem + "HEADER",
                new XElement(Tem + "UUID", invoice.Uuid),
                new XElement(Tem + "INVOICE_ID", invoice.Uuid),
                new XElement(Tem + "SENDER", invoice.SenderVkn, invoice.SenderAlias),
                new XElement(Tem + "RECEIVER", invoice.ReceiverVkn, invoice.ReceiverAlias)),
            new XElement(Tem + "CONTENT", invoice.UblBase64));

        var body = new XElement(Tem + "SendInvoiceRequest",
            headerBuilder.Build(sessionId),
            new XElement(Tem + "SENDER",
                new XElement(Tem + "vkn", invoice.SenderVkn),
                new XElement(Tem + "alias", invoice.SenderAlias)),
            new XElement(Tem + "RECEIVER",
                new XElement(Tem + "vkn", invoice.ReceiverVkn),
                new XElement(Tem + "alias", invoice.ReceiverAlias)),
            invoiceNode);

        var response = await PostAsync(serviceUrl, "SendInvoice", "IEFaturaEDM", body, ct);
        return ParseSendResult(response, invoice.Uuid);
    }

    public async Task<EdmStatusResult> GetInvoiceStatusAsync(
        string serviceUrl,
        string sessionId,
        string uuid,
        CancellationToken ct)
    {
        var body = new XElement(Tem + "GetInvoiceStatusRequest",
            headerBuilder.Build(sessionId),
            new XElement(Tem + "INVOICE",
                new XElement(Tem + "UUID", uuid),
                new XElement(Tem + "ID", uuid)));

        var response = await PostAsync(serviceUrl, "GetInvoiceStatus", "IEFaturaEDM", body, ct);
        return ParseStatusResult(response);
    }

    public async Task<EdmSendResult> SendDespatchAsync(
        string serviceUrl,
        string sessionId,
        EdmDespatchPayload despatch,
        CancellationToken ct)
    {
        var despatchNode = new XElement(Tem + "DESPATCH",
            new XElement(Tem + "HEADER",
                new XElement(Tem + "UUID", despatch.Uuid),
                new XElement(Tem + "ID", despatch.Uuid),
                new XElement(Tem + "SENDER", despatch.SenderVkn, despatch.SenderAlias),
                new XElement(Tem + "RECEIVER", despatch.ReceiverVkn, despatch.ReceiverAlias)),
            new XElement(Tem + "CONTENT", despatch.UblBase64));

        var body = new XElement(Tem + "SendDespatchRequest",
            headerBuilder.Build(sessionId),
            new XElement(Tem + "SENDER",
                new XElement(Tem + "vkn", despatch.SenderVkn),
                new XElement(Tem + "alias", despatch.SenderAlias)),
            new XElement(Tem + "RECEIVER",
                new XElement(Tem + "vkn", despatch.ReceiverVkn),
                new XElement(Tem + "alias", despatch.ReceiverAlias)),
            despatchNode);

        var response = await PostAsync(serviceUrl, "SendDespatch", "IEIrsaliyeEDM", body, ct);
        return ParseSendResult(response, despatch.Uuid);
    }

    public async Task<EdmStatusResult> GetDespatchStatusAsync(
        string serviceUrl,
        string sessionId,
        string uuid,
        CancellationToken ct)
    {
        var body = new XElement(Tem + "GetDespatchStatusRequest",
            headerBuilder.Build(sessionId),
            new XElement(Tem + "DESPATCH",
                new XElement(Tem + "UUID", uuid),
                new XElement(Tem + "ID", uuid)));

        var response = await PostAsync(serviceUrl, "GetDespatchStatus", "IEIrsaliyeEDM", body, ct);
        return ParseStatusResult(response);
    }

    private async Task<XDocument> PostAsync(
        string serviceUrl,
        string action,
        XElement bodyContent,
        CancellationToken ct) =>
        await PostAsync(serviceUrl, action, "IEFaturaEDM", bodyContent, ct);

    private async Task<XDocument> PostAsync(
        string serviceUrl,
        string action,
        string soapInterface,
        XElement bodyContent,
        CancellationToken ct)
    {
        var envelope = new XDocument(
            new XElement(Soap + "Envelope",
                new XAttribute(XNamespace.Xmlns + "soap", Soap),
                new XAttribute(XNamespace.Xmlns + "tem", Tem),
                new XElement(Soap + "Body", bodyContent)));

        using var request = new HttpRequestMessage(HttpMethod.Post, serviceUrl);
        request.Headers.Add("SOAPAction", $"\"http://tempuri.org/{soapInterface}/{action}\"");
        request.Content = new StringContent(envelope.ToString(SaveOptions.DisableFormatting), Encoding.UTF8, "text/xml");

        using var response = await httpClient.SendAsync(request, ct);
        var xml = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"EDM HTTP {(int)response.StatusCode}: {ExtractFault(xml) ?? xml[..Math.Min(500, xml.Length)]}");

        var doc = XDocument.Parse(xml);
        var fault = doc.Descendants(Soap + "Fault").FirstOrDefault();
        if (fault is not null)
            throw new InvalidOperationException($"EDM SOAP Fault: {ExtractFault(xml)}");

        return doc;
    }

    private static string? FindValue(XDocument doc, string localName) =>
        doc.Descendants().FirstOrDefault(x => x.Name.LocalName.Equals(localName, StringComparison.OrdinalIgnoreCase))?.Value;

    private static EdmSendResult ParseSendResult(XDocument doc, string uuid)
    {
        var status = FindValue(doc, "STATUS") ?? FindValue(doc, "RETURN_CODE") ?? "SENT";
        var message = FindValue(doc, "STATUS_DESCRIPTION")
            ?? FindValue(doc, "RETURN_MESSAGE")
            ?? "Gönderim tamamlandı.";
        return new EdmSendResult(uuid, status, message, true);
    }

    private static EdmStatusResult ParseStatusResult(XDocument doc)
    {
        var status = FindValue(doc, "STATUS") ?? FindValue(doc, "GIB_STATUS_CODE") ?? "UNKNOWN";
        var message = FindValue(doc, "STATUS_DESCRIPTION")
            ?? FindValue(doc, "GIB_STATUS_DESCRIPTION")
            ?? status;
        return new EdmStatusResult(status, message);
    }

    private static string? ExtractFault(string xml)
    {
        try
        {
            var doc = XDocument.Parse(xml);
            var fault = doc.Descendants().FirstOrDefault(x => x.Name.LocalName == "faultstring");
            return fault?.Value;
        }
        catch
        {
            return null;
        }
    }
}

public record EdmGibUser(string? Identifier, string? Alias, string? Title, string? Type);

public record EdmInvoicePayload(
    string Uuid,
    string SenderVkn,
    string SenderAlias,
    string ReceiverVkn,
    string ReceiverAlias,
    string UblBase64);

public record EdmDespatchPayload(
    string Uuid,
    string SenderVkn,
    string SenderAlias,
    string ReceiverVkn,
    string ReceiverAlias,
    string UblBase64);

public record EdmSendResult(string Uuid, string Status, string Message, bool Success);

public record EdmStatusResult(string Status, string Message);
