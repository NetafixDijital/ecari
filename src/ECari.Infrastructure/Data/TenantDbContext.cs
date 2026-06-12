using ECari.Domain.Entities.Tenant;
using Microsoft.EntityFrameworkCore;

namespace ECari.Infrastructure.Data;

public class TenantDbContext : DbContext
{
    public TenantDbContext(DbContextOptions<TenantDbContext> options) : base(options) { }

    public DbSet<CariAccount> CariAccounts => Set<CariAccount>();
    public DbSet<CariAccountBalanceView> CariAccountBalances => Set<CariAccountBalanceView>();
    public DbSet<CoreCurrency> Currencies => Set<CoreCurrency>();
    public DbSet<StkItem> StkItems => Set<StkItem>();
    public DbSet<StkUnit> StkUnits => Set<StkUnit>();
    public DbSet<CoreTaxRate> TaxRates => Set<CoreTaxRate>();
    public DbSet<StkStockBalance> StkStockBalances => Set<StkStockBalance>();
    public DbSet<CoreCity> Cities => Set<CoreCity>();
    public DbSet<CoreDistrict> Districts => Set<CoreDistrict>();
    public DbSet<CorePaymentTerm> PaymentTerms => Set<CorePaymentTerm>();
    public DbSet<CfgCompanyProfile> CompanyProfiles => Set<CfgCompanyProfile>();
    public DbSet<StkWarehouse> Warehouses => Set<StkWarehouse>();
    public DbSet<InvInvoice> InvInvoices => Set<InvInvoice>();
    public DbSet<InvInvoiceLine> InvInvoiceLines => Set<InvInvoiceLine>();
    public DbSet<DlnDeliveryNote> DlnDeliveryNotes => Set<DlnDeliveryNote>();
    public DbSet<DlnDeliveryNoteLine> DlnDeliveryNoteLines => Set<DlnDeliveryNoteLine>();
    public DbSet<OrdOrder> OrdOrders => Set<OrdOrder>();
    public DbSet<OrdOrderLine> OrdOrderLines => Set<OrdOrderLine>();
    public DbSet<BnkBank> BnkBanks => Set<BnkBank>();
    public DbSet<BnkAccount> BnkAccounts => Set<BnkAccount>();
    public DbSet<BnkTransaction> BnkTransactions => Set<BnkTransaction>();
    public DbSet<StkStockMovement> StkStockMovements => Set<StkStockMovement>();
    public DbSet<ExpExpense> ExpExpenses => Set<ExpExpense>();
    public DbSet<SvcTicket> SvcTickets => Set<SvcTicket>();
    public DbSet<TskTask> TskTasks => Set<TskTask>();
    public DbSet<CfgModuleSetting> CfgModuleSettings => Set<CfgModuleSetting>();
    public DbSet<CshAccount> CshAccounts => Set<CshAccount>();
    public DbSet<CshTransaction> CshTransactions => Set<CshTransaction>();
    public DbSet<CariMovement> CariMovements => Set<CariMovement>();
    public DbSet<ChqPortfolio> ChqPortfolios => Set<ChqPortfolio>();
    public DbSet<ChqInstrument> ChqInstruments => Set<ChqInstrument>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CariAccount>(e =>
        {
            e.ToTable("cari_accounts");
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).HasColumnName("code").HasMaxLength(30);
            e.Property(x => x.AccountType).HasColumnName("account_type").HasMaxLength(20);
            e.Property(x => x.Title).HasColumnName("title").HasMaxLength(300);
            e.Property(x => x.ShortName).HasColumnName("short_name").HasMaxLength(100);
            e.Property(x => x.PersonType).HasColumnName("person_type").HasMaxLength(20);
            e.Property(x => x.AddressLine).HasColumnName("address_line").HasMaxLength(500);
            e.Property(x => x.CityId).HasColumnName("city_id");
            e.Property(x => x.DistrictId).HasColumnName("district_id");
            e.Property(x => x.CountryCode).HasColumnName("country_code").HasMaxLength(2);
            e.Property(x => x.PostalCode).HasColumnName("postal_code").HasMaxLength(10);
            e.Property(x => x.PaymentTermId).HasColumnName("payment_term_id");
            e.Property(x => x.DueDays).HasColumnName("due_days");
            e.Property(x => x.TaxNumber).HasColumnName("tax_number").HasMaxLength(11);
            e.Property(x => x.IdentityNumber).HasColumnName("identity_number").HasMaxLength(11);
            e.Property(x => x.TaxOffice).HasColumnName("tax_office").HasMaxLength(100);
            e.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(30);
            e.Property(x => x.Mobile).HasColumnName("mobile").HasMaxLength(30);
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(254);
            e.Property(x => x.CurrencyId).HasColumnName("currency_id");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.Notes).HasColumnName("notes");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.CreatedBy).HasColumnName("created_by");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.Property(x => x.UpdatedBy).HasColumnName("updated_by");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            e.Property(x => x.DeletedAt).HasColumnName("deleted_at");
            e.Property(x => x.DeletedBy).HasColumnName("deleted_by");
            e.Property(x => x.RowVersion).HasColumnName("row_version").IsRowVersion();
        });

        modelBuilder.Entity<CariAccountBalanceView>(e =>
        {
            e.HasNoKey();
            e.ToView("v_cari_account_balance");
            e.Property(x => x.AccountId).HasColumnName("account_id");
            e.Property(x => x.Code).HasColumnName("code");
            e.Property(x => x.Title).HasColumnName("title");
            e.Property(x => x.AccountType).HasColumnName("account_type");
            e.Property(x => x.Phone).HasColumnName("phone");
            e.Property(x => x.Email).HasColumnName("email");
            e.Property(x => x.Balance).HasColumnName("balance");
        });

        modelBuilder.Entity<CoreCurrency>(e =>
        {
            e.ToTable("core_currencies");
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).HasColumnName("code").HasMaxLength(3);
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(50);
            e.Property(x => x.IsActive).HasColumnName("is_active");
        });

        modelBuilder.Entity<StkItem>(e =>
        {
            e.ToTable("stk_items");
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).HasColumnName("code").HasMaxLength(50);
            e.Property(x => x.Barcode).HasColumnName("barcode").HasMaxLength(50);
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(300);
            e.Property(x => x.ShortName).HasColumnName("short_name").HasMaxLength(100);
            e.Property(x => x.ItemType).HasColumnName("item_type").HasMaxLength(20);
            e.Property(x => x.TrackingType).HasColumnName("tracking_type").HasMaxLength(20);
            e.Property(x => x.CategoryId).HasColumnName("category_id");
            e.Property(x => x.BrandId).HasColumnName("brand_id");
            e.Property(x => x.BrandName).HasColumnName("brand_name").HasMaxLength(100);
            e.Property(x => x.BaseUnitId).HasColumnName("base_unit_id");
            e.Property(x => x.TaxRateId).HasColumnName("tax_rate_id");
            e.Property(x => x.PurchasePrice).HasColumnName("purchase_price");
            e.Property(x => x.SalesPrice).HasColumnName("sales_price");
            e.Property(x => x.CurrencyId).HasColumnName("currency_id");
            e.Property(x => x.MinStockLevel).HasColumnName("min_stock_level");
            e.Property(x => x.ShelfNo).HasColumnName("shelf_no").HasMaxLength(50);
            e.Property(x => x.IsWeighable).HasColumnName("is_weighable");
            e.Property(x => x.GtipCode).HasColumnName("gtip_code").HasMaxLength(12);
            e.Property(x => x.Description).HasColumnName("description");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.CreatedBy).HasColumnName("created_by");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.Property(x => x.UpdatedBy).HasColumnName("updated_by");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            e.Property(x => x.DeletedAt).HasColumnName("deleted_at");
            e.Property(x => x.DeletedBy).HasColumnName("deleted_by");
            e.Property(x => x.RowVersion).HasColumnName("row_version").IsRowVersion();
        });

        modelBuilder.Entity<StkUnit>(e =>
        {
            e.ToTable("stk_units");
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).HasColumnName("code").HasMaxLength(10);
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(50);
            e.Property(x => x.IsActive).HasColumnName("is_active");
        });

        modelBuilder.Entity<CoreTaxRate>(e =>
        {
            e.ToTable("core_tax_rates");
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).HasColumnName("code").HasMaxLength(20);
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100);
            e.Property(x => x.Rate).HasColumnName("rate");
            e.Property(x => x.IsActive).HasColumnName("is_active");
        });

        modelBuilder.Entity<StkStockBalance>(e =>
        {
            e.ToTable("stk_stock_balances");
            e.HasKey(x => x.Id);
            e.Property(x => x.ItemId).HasColumnName("item_id");
            e.Property(x => x.WarehouseId).HasColumnName("warehouse_id");
            e.Property(x => x.Quantity).HasColumnName("quantity");
            e.Property(x => x.ReservedQuantity).HasColumnName("reserved_quantity");
        });

        modelBuilder.Entity<CoreCity>(e =>
        {
            e.ToTable("core_cities");
            e.HasKey(x => x.Id);
            e.Property(x => x.PlateCode).HasColumnName("plate_code").HasMaxLength(3);
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100);
            e.Property(x => x.IsActive).HasColumnName("is_active");
        });

        modelBuilder.Entity<CoreDistrict>(e =>
        {
            e.ToTable("core_districts");
            e.HasKey(x => x.Id);
            e.Property(x => x.CityId).HasColumnName("city_id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100);
            e.Property(x => x.IsActive).HasColumnName("is_active");
        });

        modelBuilder.Entity<CorePaymentTerm>(e =>
        {
            e.ToTable("core_payment_terms");
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).HasColumnName("code").HasMaxLength(20);
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100);
            e.Property(x => x.DueDays).HasColumnName("due_days");
            e.Property(x => x.IsActive).HasColumnName("is_active");
        });

        modelBuilder.Entity<CfgCompanyProfile>(e =>
        {
            e.ToTable("cfg_company_profile");
            e.HasKey(x => x.Id);
            e.Property(x => x.LegalName).HasColumnName("legal_name").HasMaxLength(300);
            e.Property(x => x.TradeName).HasColumnName("trade_name").HasMaxLength(300);
            e.Property(x => x.TaxNumber).HasColumnName("tax_number").HasMaxLength(11);
            e.Property(x => x.TaxOffice).HasColumnName("tax_office").HasMaxLength(100);
            e.Property(x => x.Address).HasColumnName("address").HasMaxLength(500);
            e.Property(x => x.CityId).HasColumnName("city_id");
            e.Property(x => x.DistrictId).HasColumnName("district_id");
            e.Property(x => x.CountryCode).HasColumnName("country_code").HasMaxLength(2);
            e.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(30);
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(254);
            e.Property(x => x.Website).HasColumnName("website").HasMaxLength(200);
            e.Property(x => x.DefaultCurrencyId).HasColumnName("default_currency_id");
            e.Property(x => x.FiscalYearStartMonth).HasColumnName("fiscal_year_start_month");
            e.Property(x => x.IsEinvoiceUser).HasColumnName("is_einvoice_user");
            e.Property(x => x.IsEarchiveUser).HasColumnName("is_earchive_user");
            e.Property(x => x.IsEwaybillUser).HasColumnName("is_ewaybill_user");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.Property(x => x.RowVersion).HasColumnName("row_version").IsRowVersion();
        });

        modelBuilder.Entity<StkWarehouse>(e =>
        {
            e.ToTable("stk_warehouses");
            e.HasKey(x => x.Id);
            e.Property(x => x.BranchId).HasColumnName("branch_id");
            e.Property(x => x.Code).HasColumnName("code").HasMaxLength(20);
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100);
            e.Property(x => x.Address).HasColumnName("address").HasMaxLength(500);
            e.Property(x => x.IsDefault).HasColumnName("is_default");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
        });

        modelBuilder.Entity<InvInvoice>(e =>
        {
            e.ToTable("inv_invoices");
            e.HasKey(x => x.Id);
            e.Property(x => x.DocumentNo).HasColumnName("document_no").HasMaxLength(50);
            e.Property(x => x.DocumentDate).HasColumnName("document_date");
            e.Property(x => x.DocumentTime).HasColumnName("document_time");
            e.Property(x => x.InvoiceType).HasColumnName("invoice_type").HasMaxLength(30);
            e.Property(x => x.InvoiceScenario).HasColumnName("invoice_scenario").HasMaxLength(30);
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
            e.Property(x => x.AccountId).HasColumnName("account_id");
            e.Property(x => x.BranchId).HasColumnName("branch_id");
            e.Property(x => x.WarehouseId).HasColumnName("warehouse_id");
            e.Property(x => x.CurrencyId).HasColumnName("currency_id");
            e.Property(x => x.ExchangeRate).HasColumnName("exchange_rate");
            e.Property(x => x.DueDate).HasColumnName("due_date");
            e.Property(x => x.Subtotal).HasColumnName("subtotal");
            e.Property(x => x.DiscountTotal).HasColumnName("discount_total");
            e.Property(x => x.TaxTotal).HasColumnName("tax_total");
            e.Property(x => x.GrandTotal).HasColumnName("grand_total");
            e.Property(x => x.PaymentStatus).HasColumnName("payment_status").HasMaxLength(20);
            e.Property(x => x.EInvoiceType).HasColumnName("e_invoice_type").HasMaxLength(30);
            e.Property(x => x.Notes).HasColumnName("notes");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.CreatedBy).HasColumnName("created_by");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.Property(x => x.UpdatedBy).HasColumnName("updated_by");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            e.Property(x => x.DeletedAt).HasColumnName("deleted_at");
            e.Property(x => x.DeletedBy).HasColumnName("deleted_by");
            e.Property(x => x.RowVersion).HasColumnName("row_version").IsRowVersion();
            e.HasOne(x => x.Account).WithMany().HasForeignKey(x => x.AccountId);
        });

        modelBuilder.Entity<InvInvoiceLine>(e =>
        {
            e.ToTable("inv_invoice_lines");
            e.HasKey(x => x.Id);
            e.Property(x => x.InvoiceId).HasColumnName("invoice_id");
            e.Property(x => x.LineNo).HasColumnName("line_no");
            e.Property(x => x.LineType).HasColumnName("line_type").HasMaxLength(20);
            e.Property(x => x.ItemId).HasColumnName("item_id");
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            e.Property(x => x.Quantity).HasColumnName("quantity");
            e.Property(x => x.UnitId).HasColumnName("unit_id");
            e.Property(x => x.UnitPrice).HasColumnName("unit_price");
            e.Property(x => x.DiscountAmount).HasColumnName("discount_amount");
            e.Property(x => x.TaxRateId).HasColumnName("tax_rate_id");
            e.Property(x => x.TaxAmount).HasColumnName("tax_amount");
            e.Property(x => x.LineTotal).HasColumnName("line_total");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            e.HasOne(x => x.Invoice).WithMany().HasForeignKey(x => x.InvoiceId);
        });

        modelBuilder.Entity<DlnDeliveryNote>(e =>
        {
            e.ToTable("dln_delivery_notes");
            e.HasKey(x => x.Id);
            e.Property(x => x.DocumentNo).HasColumnName("document_no").HasMaxLength(50);
            e.Property(x => x.DocumentDate).HasColumnName("document_date");
            e.Property(x => x.ShipmentDate).HasColumnName("shipment_date");
            e.Property(x => x.DocumentType).HasColumnName("document_type").HasMaxLength(20);
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
            e.Property(x => x.AccountId).HasColumnName("account_id");
            e.Property(x => x.BranchId).HasColumnName("branch_id");
            e.Property(x => x.WarehouseId).HasColumnName("warehouse_id");
            e.Property(x => x.ShippingAddress).HasColumnName("shipping_address").HasMaxLength(500);
            e.Property(x => x.DriverName).HasColumnName("driver_name").HasMaxLength(100);
            e.Property(x => x.VehiclePlate).HasColumnName("vehicle_plate").HasMaxLength(20);
            e.Property(x => x.TransportType).HasColumnName("transport_type").HasMaxLength(30);
            e.Property(x => x.CarrierName).HasColumnName("carrier_name").HasMaxLength(200);
            e.Property(x => x.Notes).HasColumnName("notes");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.CreatedBy).HasColumnName("created_by");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.Property(x => x.UpdatedBy).HasColumnName("updated_by");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            e.Property(x => x.DeletedAt).HasColumnName("deleted_at");
            e.Property(x => x.DeletedBy).HasColumnName("deleted_by");
            e.Property(x => x.RowVersion).HasColumnName("row_version").IsRowVersion();
            e.HasOne(x => x.Account).WithMany().HasForeignKey(x => x.AccountId);
        });

        modelBuilder.Entity<DlnDeliveryNoteLine>(e =>
        {
            e.ToTable("dln_delivery_note_lines");
            e.HasKey(x => x.Id);
            e.Property(x => x.DeliveryNoteId).HasColumnName("delivery_note_id");
            e.Property(x => x.LineNo).HasColumnName("line_no");
            e.Property(x => x.ItemId).HasColumnName("item_id");
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            e.Property(x => x.Quantity).HasColumnName("quantity");
            e.Property(x => x.UnitId).HasColumnName("unit_id");
            e.Property(x => x.WarehouseId).HasColumnName("warehouse_id");
            e.Property(x => x.LotNo).HasColumnName("lot_no").HasMaxLength(50);
            e.Property(x => x.SerialNo).HasColumnName("serial_no").HasMaxLength(50);
            e.Property(x => x.SourceLineId).HasColumnName("source_line_id");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            e.HasOne(x => x.DeliveryNote).WithMany().HasForeignKey(x => x.DeliveryNoteId);
        });

        modelBuilder.Entity<OrdOrder>(e =>
        {
            e.ToTable("ord_orders");
            e.HasKey(x => x.Id);
            e.Property(x => x.DocumentNo).HasColumnName("document_no").HasMaxLength(50);
            e.Property(x => x.DocumentDate).HasColumnName("document_date");
            e.Property(x => x.OrderType).HasColumnName("order_type").HasMaxLength(20);
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
            e.Property(x => x.AccountId).HasColumnName("account_id");
            e.Property(x => x.BranchId).HasColumnName("branch_id");
            e.Property(x => x.WarehouseId).HasColumnName("warehouse_id");
            e.Property(x => x.CurrencyId).HasColumnName("currency_id");
            e.Property(x => x.ExchangeRate).HasColumnName("exchange_rate");
            e.Property(x => x.DeliveryDate).HasColumnName("delivery_date");
            e.Property(x => x.Subtotal).HasColumnName("subtotal");
            e.Property(x => x.DiscountTotal).HasColumnName("discount_total");
            e.Property(x => x.TaxTotal).HasColumnName("tax_total");
            e.Property(x => x.GrandTotal).HasColumnName("grand_total");
            e.Property(x => x.CustomerPoNo).HasColumnName("customer_po_no").HasMaxLength(50);
            e.Property(x => x.Notes).HasColumnName("notes");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.CreatedBy).HasColumnName("created_by");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.Property(x => x.UpdatedBy).HasColumnName("updated_by");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            e.Property(x => x.DeletedAt).HasColumnName("deleted_at");
            e.Property(x => x.DeletedBy).HasColumnName("deleted_by");
            e.Property(x => x.RowVersion).HasColumnName("row_version").IsRowVersion();
            e.HasOne(x => x.Account).WithMany().HasForeignKey(x => x.AccountId);
        });

        modelBuilder.Entity<OrdOrderLine>(e =>
        {
            e.ToTable("ord_order_lines");
            e.HasKey(x => x.Id);
            e.Property(x => x.OrderId).HasColumnName("order_id");
            e.Property(x => x.LineNo).HasColumnName("line_no");
            e.Property(x => x.ItemId).HasColumnName("item_id");
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            e.Property(x => x.Quantity).HasColumnName("quantity");
            e.Property(x => x.DeliveredQuantity).HasColumnName("delivered_quantity");
            e.Property(x => x.InvoicedQuantity).HasColumnName("invoiced_quantity");
            e.Property(x => x.UnitId).HasColumnName("unit_id");
            e.Property(x => x.UnitPrice).HasColumnName("unit_price");
            e.Property(x => x.DiscountRate).HasColumnName("discount_rate");
            e.Property(x => x.TaxRateId).HasColumnName("tax_rate_id");
            e.Property(x => x.TaxAmount).HasColumnName("tax_amount");
            e.Property(x => x.LineTotal).HasColumnName("line_total");
            e.Property(x => x.WarehouseId).HasColumnName("warehouse_id");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            e.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId);
        });

        modelBuilder.Entity<BnkBank>(e =>
        {
            e.ToTable("bnk_banks");
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).HasColumnName("code").HasMaxLength(10);
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100);
            e.Property(x => x.IsActive).HasColumnName("is_active");
        });

        modelBuilder.Entity<BnkAccount>(e =>
        {
            e.ToTable("bnk_accounts");
            e.HasKey(x => x.Id);
            e.Property(x => x.BankId).HasColumnName("bank_id");
            e.Property(x => x.BranchId).HasColumnName("branch_id");
            e.Property(x => x.Code).HasColumnName("code").HasMaxLength(20);
            e.Property(x => x.AccountName).HasColumnName("account_name").HasMaxLength(100);
            e.Property(x => x.AccountNo).HasColumnName("account_no").HasMaxLength(30);
            e.Property(x => x.Iban).HasColumnName("iban").HasMaxLength(34);
            e.Property(x => x.CurrencyId).HasColumnName("currency_id");
            e.Property(x => x.OpeningBalance).HasColumnName("opening_balance");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.CreatedBy).HasColumnName("created_by");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.Property(x => x.UpdatedBy).HasColumnName("updated_by");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            e.Property(x => x.DeletedAt).HasColumnName("deleted_at");
            e.Property(x => x.DeletedBy).HasColumnName("deleted_by");
            e.Property(x => x.RowVersion).HasColumnName("row_version").IsRowVersion();
            e.HasOne(x => x.Bank).WithMany().HasForeignKey(x => x.BankId);
        });

        modelBuilder.Entity<BnkTransaction>(e =>
        {
            e.ToTable("bnk_transactions");
            e.HasKey(x => x.Id);
            e.Property(x => x.BankAccountId).HasColumnName("bank_account_id");
            e.Property(x => x.TransactionDate).HasColumnName("transaction_date");
            e.Property(x => x.ValueDate).HasColumnName("value_date");
            e.Property(x => x.TransactionType).HasColumnName("transaction_type").HasMaxLength(30);
            e.Property(x => x.AccountId).HasColumnName("account_id");
            e.Property(x => x.Amount).HasColumnName("amount");
            e.Property(x => x.CurrencyId).HasColumnName("currency_id");
            e.Property(x => x.ExchangeRate).HasColumnName("exchange_rate");
            e.Property(x => x.ReferenceNo).HasColumnName("reference_no").HasMaxLength(50);
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            e.Property(x => x.IsReconciled).HasColumnName("is_reconciled");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.CreatedBy).HasColumnName("created_by");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            e.Property(x => x.RowVersion).HasColumnName("row_version").IsRowVersion();
            e.HasOne(x => x.BankAccount).WithMany().HasForeignKey(x => x.BankAccountId);
            e.HasOne(x => x.Account).WithMany().HasForeignKey(x => x.AccountId);
        });

        modelBuilder.Entity<StkStockMovement>(e =>
        {
            e.ToTable("stk_stock_movements");
            e.HasKey(x => x.Id);
            e.Property(x => x.ItemId).HasColumnName("item_id");
            e.Property(x => x.WarehouseId).HasColumnName("warehouse_id");
            e.Property(x => x.MovementDate).HasColumnName("movement_date");
            e.Property(x => x.MovementType).HasColumnName("movement_type").HasMaxLength(30);
            e.Property(x => x.Quantity).HasColumnName("quantity");
            e.Property(x => x.UnitId).HasColumnName("unit_id");
            e.Property(x => x.UnitPrice).HasColumnName("unit_price");
            e.Property(x => x.DocumentModule).HasColumnName("document_module").HasMaxLength(30);
            e.Property(x => x.DocumentId).HasColumnName("document_id");
            e.Property(x => x.DocumentLineId).HasColumnName("document_line_id");
            e.Property(x => x.LotNo).HasColumnName("lot_no").HasMaxLength(50);
            e.Property(x => x.SerialNo).HasColumnName("serial_no").HasMaxLength(50);
            e.Property(x => x.ExpiryDate).HasColumnName("expiry_date");
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.CreatedBy).HasColumnName("created_by");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            e.Property(x => x.RowVersion).HasColumnName("row_version").IsRowVersion();
            e.HasOne(x => x.Item).WithMany().HasForeignKey(x => x.ItemId);
            e.HasOne(x => x.Warehouse).WithMany().HasForeignKey(x => x.WarehouseId);
            e.HasOne(x => x.Unit).WithMany().HasForeignKey(x => x.UnitId);
        });

        modelBuilder.Entity<ExpExpense>(e =>
        {
            e.ToTable("exp_expenses");
            e.HasKey(x => x.Id);
            e.Property(x => x.DocumentNo).HasColumnName("document_no").HasMaxLength(50);
            e.Property(x => x.ExpenseDate).HasColumnName("expense_date");
            e.Property(x => x.Category).HasColumnName("category").HasMaxLength(50);
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            e.Property(x => x.Amount).HasColumnName("amount");
            e.Property(x => x.CurrencyId).HasColumnName("currency_id");
            e.Property(x => x.RequesterName).HasColumnName("requester_name").HasMaxLength(100);
            e.Property(x => x.ApprovalStatus).HasColumnName("approval_status").HasMaxLength(20);
            e.Property(x => x.PaymentMethod).HasColumnName("payment_method").HasMaxLength(30);
            e.Property(x => x.Notes).HasColumnName("notes");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
        });

        modelBuilder.Entity<SvcTicket>(e =>
        {
            e.ToTable("svc_tickets");
            e.HasKey(x => x.Id);
            e.Property(x => x.TicketNo).HasColumnName("ticket_no").HasMaxLength(50);
            e.Property(x => x.TicketDate).HasColumnName("ticket_date");
            e.Property(x => x.AccountId).HasColumnName("account_id");
            e.Property(x => x.DeviceName).HasColumnName("device_name").HasMaxLength(200);
            e.Property(x => x.ProblemDescription).HasColumnName("problem_description");
            e.Property(x => x.TechnicianName).HasColumnName("technician_name").HasMaxLength(100);
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(30);
            e.Property(x => x.Priority).HasColumnName("priority").HasMaxLength(20);
            e.Property(x => x.Resolution).HasColumnName("resolution");
            e.Property(x => x.ClosedAt).HasColumnName("closed_at");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            e.HasOne(x => x.Account).WithMany().HasForeignKey(x => x.AccountId);
        });

        modelBuilder.Entity<TskTask>(e =>
        {
            e.ToTable("tsk_tasks");
            e.HasKey(x => x.Id);
            e.Property(x => x.TaskNo).HasColumnName("task_no").HasMaxLength(30);
            e.Property(x => x.Title).HasColumnName("title").HasMaxLength(300);
            e.Property(x => x.Description).HasColumnName("description");
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
            e.Property(x => x.Priority).HasColumnName("priority").HasMaxLength(20);
            e.Property(x => x.StartDate).HasColumnName("start_date");
            e.Property(x => x.EndDate).HasColumnName("end_date");
            e.Property(x => x.AssigneeName).HasColumnName("assignee_name").HasMaxLength(100);
            e.Property(x => x.ProgressPercent).HasColumnName("progress_percent");
            e.Property(x => x.CompletedAt).HasColumnName("completed_at");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
        });

        modelBuilder.Entity<CfgModuleSetting>(e =>
        {
            e.ToTable("cfg_module_settings");
            e.HasKey(x => x.Id);
            e.Property(x => x.ModuleCode).HasColumnName("module_code").HasMaxLength(30);
            e.Property(x => x.SettingKey).HasColumnName("setting_key").HasMaxLength(100);
            e.Property(x => x.SettingValue).HasColumnName("setting_value");
            e.Property(x => x.DataType).HasColumnName("data_type").HasMaxLength(20);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        });

        modelBuilder.Entity<CariMovement>(e =>
        {
            e.ToTable("cari_movements");
            e.HasKey(x => x.Id);
            e.Property(x => x.AccountId).HasColumnName("account_id");
            e.Property(x => x.MovementDate).HasColumnName("movement_date");
            e.Property(x => x.DueDate).HasColumnName("due_date");
            e.Property(x => x.MovementType).HasColumnName("movement_type").HasMaxLength(30);
            e.Property(x => x.Debit).HasColumnName("debit");
            e.Property(x => x.Credit).HasColumnName("credit");
            e.Property(x => x.CurrencyId).HasColumnName("currency_id");
            e.Property(x => x.ExchangeRate).HasColumnName("exchange_rate");
            e.Property(x => x.AmountForeign).HasColumnName("amount_foreign");
            e.Property(x => x.DocumentModule).HasColumnName("document_module").HasMaxLength(30);
            e.Property(x => x.DocumentId).HasColumnName("document_id");
            e.Property(x => x.DocumentNo).HasColumnName("document_no").HasMaxLength(50);
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            e.Property(x => x.FiscalPeriodId).HasColumnName("fiscal_period_id");
            e.Property(x => x.IsReconciled).HasColumnName("is_reconciled");
            e.Property(x => x.ReconciledAt).HasColumnName("reconciled_at");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.CreatedBy).HasColumnName("created_by");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            e.Property(x => x.RowVersion).HasColumnName("row_version").IsRowVersion();
            e.HasOne(x => x.Account).WithMany().HasForeignKey(x => x.AccountId);
        });

        modelBuilder.Entity<CshAccount>(e =>
        {
            e.ToTable("csh_accounts");
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).HasColumnName("code").HasMaxLength(20);
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100);
            e.Property(x => x.CashType).HasColumnName("cash_type").HasMaxLength(30);
            e.Property(x => x.BranchId).HasColumnName("branch_id");
            e.Property(x => x.CurrencyId).HasColumnName("currency_id");
            e.Property(x => x.OpeningBalance).HasColumnName("opening_balance");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.CreatedBy).HasColumnName("created_by");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.Property(x => x.UpdatedBy).HasColumnName("updated_by");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            e.Property(x => x.DeletedAt).HasColumnName("deleted_at");
            e.Property(x => x.DeletedBy).HasColumnName("deleted_by");
            e.Property(x => x.RowVersion).HasColumnName("row_version").IsRowVersion();
        });

        modelBuilder.Entity<ChqPortfolio>(e =>
        {
            e.ToTable("chq_portfolios");
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).HasColumnName("code").HasMaxLength(20);
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100);
            e.Property(x => x.PortfolioType).HasColumnName("portfolio_type").HasMaxLength(30);
            e.Property(x => x.IsActive).HasColumnName("is_active");
        });

        modelBuilder.Entity<ChqInstrument>(e =>
        {
            e.ToTable("chq_instruments");
            e.HasKey(x => x.Id);
            e.Property(x => x.InstrumentType).HasColumnName("instrument_type").HasMaxLength(20);
            e.Property(x => x.Direction).HasColumnName("direction").HasMaxLength(20);
            e.Property(x => x.PortfolioId).HasColumnName("portfolio_id");
            e.Property(x => x.AccountId).HasColumnName("account_id");
            e.Property(x => x.BankName).HasColumnName("bank_name").HasMaxLength(100);
            e.Property(x => x.BranchName).HasColumnName("branch_name").HasMaxLength(100);
            e.Property(x => x.AccountNo).HasColumnName("account_no").HasMaxLength(30);
            e.Property(x => x.InstrumentNo).HasColumnName("instrument_no").HasMaxLength(30);
            e.Property(x => x.IssueDate).HasColumnName("issue_date");
            e.Property(x => x.DueDate).HasColumnName("due_date");
            e.Property(x => x.Amount).HasColumnName("amount");
            e.Property(x => x.CurrencyId).HasColumnName("currency_id");
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(30);
            e.Property(x => x.Notes).HasColumnName("notes").HasMaxLength(500);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            e.HasOne(x => x.Portfolio).WithMany().HasForeignKey(x => x.PortfolioId);
            e.HasOne(x => x.Account).WithMany().HasForeignKey(x => x.AccountId);
        });

        modelBuilder.Entity<CshTransaction>(e =>
        {
            e.ToTable("csh_transactions");
            e.HasKey(x => x.Id);
            e.Property(x => x.CashAccountId).HasColumnName("cash_account_id");
            e.Property(x => x.TransactionDate).HasColumnName("transaction_date");
            e.Property(x => x.TransactionType).HasColumnName("transaction_type").HasMaxLength(30);
            e.Property(x => x.Amount).HasColumnName("amount");
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            e.Property(x => x.ReferenceNo).HasColumnName("reference_no").HasMaxLength(50);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.CreatedBy).HasColumnName("created_by");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted");
        });
    }
}
