using System.Globalization;
using System.Text;
using System.Xml.Linq;

namespace ECari.Infrastructure.Integrations.Edm;

public record UblParty(
    string Identifier,
    string Title,
    string? TaxOffice,
    string? Address,
    string? City,
    string? District,
    string? Email,
    string? Phone);

public record UblInvoiceLine(
    int LineNo,
    string Description,
    decimal Quantity,
    string UnitCode,
    decimal UnitPrice,
    decimal TaxPercent,
    decimal LineTotal,
    decimal TaxAmount);

public record UblInvoiceContext(
    string Uuid,
    string DocumentNo,
    DateOnly DocumentDate,
    DateOnly? DueDate,
    string ProfileId,
    string InvoiceTypeCode,
    UblParty Supplier,
    UblParty Customer,
    IReadOnlyList<UblInvoiceLine> Lines,
    decimal Subtotal,
    decimal TaxTotal,
    decimal GrandTotal,
    string CurrencyCode = "TRY");

public record UblDespatchLine(
    int LineNo,
    string Description,
    decimal Quantity,
    string UnitCode);

public record UblDespatchContext(
    string Uuid,
    string DocumentNo,
    DateOnly DocumentDate,
    UblParty Supplier,
    UblParty Customer,
    IReadOnlyList<UblDespatchLine> Lines,
    string? DriverName,
    string? VehiclePlate);

public static class UblTrInvoiceBuilder
{
    private static readonly XNamespace Inv = "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2";
    private static readonly XNamespace Cac = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2";
    private static readonly XNamespace Cbc = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2";
    private static readonly XNamespace Ext = "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2";

    public static string BuildXml(UblInvoiceContext ctx)
    {
        var issueDate = ctx.DocumentDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var dueDate = (ctx.DueDate ?? ctx.DocumentDate).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var issueTime = DateTime.Now.ToString("HH:mm:ss", CultureInfo.InvariantCulture);

        var doc = new XDocument(
            new XElement(Inv + "Invoice",
                new XAttribute(XNamespace.Xmlns + "cac", Cac),
                new XAttribute(XNamespace.Xmlns + "cbc", Cbc),
                new XAttribute(XNamespace.Xmlns + "ext", Ext),
                new XElement(Ext + "UBLExtensions",
                    new XElement(Ext + "UBLExtension",
                        new XElement(Ext + "ExtensionContent"))),
                new XElement(Cbc + "UBLVersionID", "2.1"),
                new XElement(Cbc + "CustomizationID", "TR1.2"),
                new XElement(Cbc + "ProfileID", ctx.ProfileId),
                new XElement(Cbc + "ID", ctx.DocumentNo),
                new XElement(Cbc + "CopyIndicator", "false"),
                new XElement(Cbc + "UUID", ctx.Uuid),
                new XElement(Cbc + "IssueDate", issueDate),
                new XElement(Cbc + "IssueTime", issueTime),
                new XElement(Cbc + "InvoiceTypeCode", ctx.InvoiceTypeCode),
                new XElement(Cbc + "DocumentCurrencyCode", ctx.CurrencyCode),
                new XElement(Cbc + "LineCountNumeric", ctx.Lines.Count),
                BuildParty("AccountingSupplierParty", ctx.Supplier),
                BuildParty("AccountingCustomerParty", ctx.Customer),
                new XElement(Cac + "PaymentMeans",
                    new XElement(Cbc + "PaymentMeansCode", "1"),
                    new XElement(Cac + "PayeeFinancialAccount",
                        new XElement(Cbc + "ID", "-"))),
                new XElement(Cac + "PaymentTerms",
                    new XElement(Cbc + "PaymentDueDate", dueDate)),
                BuildTaxTotal(ctx.TaxTotal, ctx.Subtotal, ctx.Lines),
                new XElement(Cac + "LegalMonetaryTotal",
                    new XElement(Cbc + "LineExtensionAmount",
                        new XAttribute("currencyID", ctx.CurrencyCode), F(ctx.Subtotal)),
                    new XElement(Cbc + "TaxExclusiveAmount",
                        new XAttribute("currencyID", ctx.CurrencyCode), F(ctx.Subtotal)),
                    new XElement(Cbc + "TaxInclusiveAmount",
                        new XAttribute("currencyID", ctx.CurrencyCode), F(ctx.GrandTotal)),
                    new XElement(Cbc + "PayableAmount",
                        new XAttribute("currencyID", ctx.CurrencyCode), F(ctx.GrandTotal))),
                ctx.Lines.Select(BuildInvoiceLine)));

        return doc.ToString(SaveOptions.DisableFormatting);
    }

    public static string ToBase64(string xml) =>
        Convert.ToBase64String(Encoding.UTF8.GetBytes(xml));

    private static XElement BuildParty(string elementName, UblParty party) =>
        BuildPartyElement(elementName, party);

    internal static XElement BuildPartyElement(string elementName, UblParty party)
    {
        var scheme = party.Identifier.Length == 11 ? "TCKN" : "VKN";
        return new XElement(Cac + elementName,
            new XElement(Cac + "Party",
                new XElement(Cac + "PartyIdentification",
                    new XElement(Cbc + "ID",
                        new XAttribute("schemeID", scheme), party.Identifier)),
                new XElement(Cac + "PartyName",
                    new XElement(Cbc + "Name", party.Title)),
                party.Address is not null
                    ? new XElement(Cac + "PostalAddress",
                        new XElement(Cbc + "StreetName", party.Address),
                        party.City is not null ? new XElement(Cbc + "CityName", party.City) : null,
                        party.District is not null ? new XElement(Cbc + "CitySubdivisionName", party.District) : null,
                        new XElement(Cac + "Country",
                            new XElement(Cbc + "Name", "Türkiye")))
                    : null,
                party.TaxOffice is not null
                    ? new XElement(Cac + "PartyTaxScheme",
                        new XElement(Cac + "TaxScheme",
                            new XElement(Cbc + "Name", party.TaxOffice)))
                    : null,
                party.Phone is not null
                    ? new XElement(Cac + "Contact",
                        new XElement(Cbc + "Telephone", party.Phone),
                        party.Email is not null ? new XElement(Cbc + "ElectronicMail", party.Email) : null)
                    : null));
    }

    private static XElement BuildTaxTotal(decimal taxTotal, decimal subtotal, IReadOnlyList<UblInvoiceLine> lines)
    {
        var grouped = lines.GroupBy(l => l.TaxPercent).OrderBy(g => g.Key);
        return new XElement(Cac + "TaxTotal",
            new XElement(Cbc + "TaxAmount",
                new XAttribute("currencyID", "TRY"), F(taxTotal)),
            grouped.Select(g =>
            {
                var taxable = g.Sum(x => x.LineTotal - x.TaxAmount);
                var tax = g.Sum(x => x.TaxAmount);
                return new XElement(Cac + "TaxSubtotal",
                    new XElement(Cbc + "TaxableAmount",
                        new XAttribute("currencyID", "TRY"), F(taxable)),
                    new XElement(Cbc + "TaxAmount",
                        new XAttribute("currencyID", "TRY"), F(tax)),
                    new XElement(Cbc + "Percent", F(g.Key)),
                    new XElement(Cac + "TaxCategory",
                        new XElement(Cac + "TaxScheme",
                            new XElement(Cbc + "Name", "KDV"),
                            new XElement(Cbc + "TaxTypeCode", "0015"))));
            }));
    }

    private static XElement BuildInvoiceLine(UblInvoiceLine line)
    {
        var taxable = line.LineTotal - line.TaxAmount;
        return new XElement(Cac + "InvoiceLine",
            new XElement(Cbc + "ID", line.LineNo),
            new XElement(Cbc + "InvoicedQuantity",
                new XAttribute("unitCode", line.UnitCode), F(line.Quantity)),
            new XElement(Cbc + "LineExtensionAmount",
                new XAttribute("currencyID", "TRY"), F(taxable)),
            new XElement(Cac + "TaxTotal",
                new XElement(Cbc + "TaxAmount",
                    new XAttribute("currencyID", "TRY"), F(line.TaxAmount)),
                new XElement(Cac + "TaxSubtotal",
                    new XElement(Cbc + "TaxableAmount",
                        new XAttribute("currencyID", "TRY"), F(taxable)),
                    new XElement(Cbc + "TaxAmount",
                        new XAttribute("currencyID", "TRY"), F(line.TaxAmount)),
                    new XElement(Cbc + "Percent", F(line.TaxPercent)),
                    new XElement(Cac + "TaxCategory",
                        new XElement(Cac + "TaxScheme",
                            new XElement(Cbc + "Name", "KDV"),
                            new XElement(Cbc + "TaxTypeCode", "0015"))))),
            new XElement(Cac + "Item",
                new XElement(Cbc + "Name", line.Description)),
            new XElement(Cac + "Price",
                new XElement(Cbc + "PriceAmount",
                    new XAttribute("currencyID", "TRY"), F(line.UnitPrice))));
    }

    private static string F(decimal value) =>
        value.ToString("0.00", CultureInfo.InvariantCulture);
}

public static class UblTrDespatchBuilder
{
    private static readonly XNamespace Des = "urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2";
    private static readonly XNamespace Cac = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2";
    private static readonly XNamespace Cbc = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2";
    private static readonly XNamespace Ext = "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2";

    public static string BuildXml(UblDespatchContext ctx)
    {
        var issueDate = ctx.DocumentDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var issueTime = DateTime.Now.ToString("HH:mm:ss", CultureInfo.InvariantCulture);

        var doc = new XDocument(
            new XElement(Des + "DespatchAdvice",
                new XAttribute(XNamespace.Xmlns + "cac", Cac),
                new XAttribute(XNamespace.Xmlns + "cbc", Cbc),
                new XAttribute(XNamespace.Xmlns + "ext", Ext),
                new XElement(Ext + "UBLExtensions",
                    new XElement(Ext + "UBLExtension",
                        new XElement(Ext + "ExtensionContent"))),
                new XElement(Cbc + "UBLVersionID", "2.1"),
                new XElement(Cbc + "CustomizationID", "TR1.2"),
                new XElement(Cbc + "ProfileID", "TEMELIRSALIYE"),
                new XElement(Cbc + "ID", ctx.DocumentNo),
                new XElement(Cbc + "CopyIndicator", "false"),
                new XElement(Cbc + "UUID", ctx.Uuid),
                new XElement(Cbc + "IssueDate", issueDate),
                new XElement(Cbc + "IssueTime", issueTime),
                new XElement(Cbc + "DespatchAdviceTypeCode", "SEVK"),
                new XElement(Cbc + "LineCountNumeric", ctx.Lines.Count),
                UblTrInvoiceBuilder.BuildPartyElement("DespatchSupplierParty", ctx.Supplier),
                UblTrInvoiceBuilder.BuildPartyElement("DeliveryCustomerParty", ctx.Customer),
                ctx.DriverName is not null || ctx.VehiclePlate is not null
                    ? new XElement(Cac + "Shipment",
                        new XElement(Cac + "Delivery",
                            ctx.DriverName is not null
                                ? new XElement(Cac + "DeliveryParty",
                                    new XElement(Cac + "PartyName",
                                        new XElement(Cbc + "Name", ctx.DriverName)))
                                : null,
                            ctx.VehiclePlate is not null
                                ? new XElement(Cac + "ShipmentStage",
                                    new XElement(Cac + "TransportMeans",
                                        new XElement(Cac + "RoadTransport",
                                            new XElement(Cbc + "LicensePlateID", ctx.VehiclePlate))))
                                : null))
                    : null,
                ctx.Lines.Select(BuildLine)));

        return doc.ToString(SaveOptions.DisableFormatting);
    }

    public static string ToBase64(string xml) =>
        UblTrInvoiceBuilder.ToBase64(xml);

    private static XElement BuildLine(UblDespatchLine line) =>
        new(Cac + "DespatchLine",
            new XElement(Cbc + "ID", line.LineNo),
            new XElement(Cbc + "DeliveredQuantity",
                new XAttribute("unitCode", line.UnitCode), line.Quantity.ToString("0.####", CultureInfo.InvariantCulture)),
            new XElement(Cac + "OrderLineReference",
                new XElement(Cbc + "LineID", line.LineNo)),
            new XElement(Cac + "Item",
                new XElement(Cbc + "Name", line.Description)));
}
