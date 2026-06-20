using System.Globalization;
using System.Xml.Linq;
using Microsoft.Extensions.Options;

namespace ECari.Infrastructure.Integrations.Edm;

public class EdmRequestHeaderBuilder(IOptions<EdmOptions> options)
{
    private static readonly XNamespace Tem = "http://tempuri.org/";

    public XElement Build(string sessionId)
    {
        var now = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture);
        return new XElement(Tem + "REQUEST_HEADER",
            new XElement(Tem + "SESSION_ID", sessionId),
            new XElement(Tem + "CLIENT_TXN_ID", Guid.NewGuid().ToString()),
            new XElement(Tem + "ACTION_DATE", now),
            new XElement(Tem + "REASON", options.Value.Reason),
            new XElement(Tem + "APPLICATION_NAME", options.Value.ApplicationName),
            new XElement(Tem + "HOSTNAME", options.Value.Hostname),
            new XElement(Tem + "CHANNEL_NAME", options.Value.ChannelName),
            new XElement(Tem + "COMPRESSED", "N"));
    }
}
