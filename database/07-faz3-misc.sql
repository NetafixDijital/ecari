/*
================================================================================
  E-CARI — FAZ 3: Masraf (exp_) + Servis (svc_) + Görev (tsk_)
================================================================================
*/
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID(N'dbo.exp_expenses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.exp_expenses (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        document_no         NVARCHAR(50)    NOT NULL,
        expense_date        DATE            NOT NULL,
        category            NVARCHAR(50)    NOT NULL,
        description         NVARCHAR(500)   NOT NULL,
        amount              DECIMAL(18,2)   NOT NULL,
        currency_id         BIGINT          NOT NULL,
        requester_name      NVARCHAR(100)   NULL,
        approval_status     NVARCHAR(20)    NOT NULL DEFAULT N'PENDING',
        payment_method      NVARCHAR(30)    NULL,
        notes               NVARCHAR(MAX)   NULL,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted          BIT             NOT NULL DEFAULT 0,
        CONSTRAINT PK_exp_expenses PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_exp_expenses_document_no UNIQUE (document_no),
        CONSTRAINT FK_exp_expenses_currency FOREIGN KEY (currency_id) REFERENCES dbo.core_currencies (id)
    );
END
GO

IF OBJECT_ID(N'dbo.svc_tickets', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.svc_tickets (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        ticket_no           NVARCHAR(50)    NOT NULL,
        ticket_date         DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        account_id          BIGINT          NOT NULL,
        device_name         NVARCHAR(200)   NULL,
        problem_description NVARCHAR(MAX)   NOT NULL,
        technician_name     NVARCHAR(100)   NULL,
        status              NVARCHAR(30)    NOT NULL DEFAULT N'WAITING',
        priority            NVARCHAR(20)    NOT NULL DEFAULT N'NORMAL',
        resolution          NVARCHAR(MAX)   NULL,
        closed_at           DATETIME2(3)    NULL,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted          BIT             NOT NULL DEFAULT 0,
        CONSTRAINT PK_svc_tickets PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_svc_tickets_ticket_no UNIQUE (ticket_no),
        CONSTRAINT FK_svc_tickets_account FOREIGN KEY (account_id) REFERENCES dbo.cari_accounts (id)
    );
END
GO

IF OBJECT_ID(N'dbo.tsk_tasks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tsk_tasks (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        task_no             NVARCHAR(30)    NOT NULL,
        title               NVARCHAR(300)   NOT NULL,
        description         NVARCHAR(MAX)   NULL,
        status              NVARCHAR(20)    NOT NULL DEFAULT N'PENDING',
        priority            NVARCHAR(20)    NOT NULL DEFAULT N'NORMAL',
        start_date          DATE            NOT NULL,
        end_date            DATE            NOT NULL,
        assignee_name       NVARCHAR(100)   NULL,
        progress_percent    TINYINT         NOT NULL DEFAULT 0,
        completed_at        DATETIME2(3)    NULL,
        created_at          DATETIME2(3)    NOT NULL DEFAULT SYSUTCDATETIME(),
        is_deleted          BIT             NOT NULL DEFAULT 0,
        CONSTRAINT PK_tsk_tasks PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tsk_tasks_task_no UNIQUE (task_no)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.exp_expenses WHERE document_no = N'MSF-2026-001')
BEGIN
    DECLARE @Cur BIGINT = (SELECT TOP 1 id FROM dbo.core_currencies WHERE code = N'TRY');
    INSERT INTO dbo.exp_expenses (document_no, expense_date, category, description, amount, currency_id, requester_name, approval_status, payment_method)
    VALUES
        (N'MSF-2026-001', '2026-05-28', N'yakit', N'Ankara müşteri ziyareti — yakıt', 1850.00, @Cur, N'Ali Demir', N'APPROVED', N'CASH'),
        (N'MSF-2026-002', '2026-05-29', N'kirtasiye', N'Ofis kırtasiye alımı', 420.50, @Cur, N'Ayşe Yılmaz', N'PENDING', N'CASH'),
        (N'MSF-2026-003', '2026-05-27', N'yemek', N'Müşteri yemeği', 680.00, @Cur, N'Mehmet Kaya', N'PAID', N'CARD');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.svc_tickets WHERE ticket_no = N'SRV-2026-0048')
BEGIN
    DECLARE @Cari1 BIGINT = COALESCE((SELECT id FROM dbo.cari_accounts WHERE code = N'M00004' AND is_deleted = 0), (SELECT TOP 1 id FROM dbo.cari_accounts WHERE is_deleted = 0 ORDER BY id));
    DECLARE @Cari2 BIGINT = COALESCE((SELECT id FROM dbo.cari_accounts WHERE code = N'M00002' AND is_deleted = 0), @Cari1);
    INSERT INTO dbo.svc_tickets (ticket_no, ticket_date, account_id, device_name, problem_description, technician_name, status, priority)
    VALUES
        (N'SRV-2026-0048', '2026-05-28', @Cari1, N'Dell Latitude 5520', N'Ekran açılmıyor, güç LED yanıyor', N'Ali Kaya', N'IN_PROGRESS', N'HIGH'),
        (N'SRV-2026-0047', '2026-05-29', @Cari2, N'HP LaserJet Pro', N'Kağıt sıkışması, toner uyarısı', NULL, N'WAITING', N'NORMAL'),
        (N'SRV-2026-0046', '2026-05-25', @Cari2, N'Lenovo ThinkPad T14', N'SSD yükseltme + Windows kurulum', N'Ali Kaya', N'COMPLETED', N'NORMAL');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tsk_tasks WHERE task_no = N'GRV-2026-001')
BEGIN
    INSERT INTO dbo.tsk_tasks (task_no, title, status, priority, start_date, end_date, assignee_name, progress_percent)
    VALUES
        (N'GRV-2026-001', N'Mayıs cari mutabakatları', N'IN_PROGRESS', N'HIGH', '2026-05-28', '2026-06-05', N'Ayşe Yılmaz', 40),
        (N'GRV-2026-002', N'Stok sayımı — Ana depo', N'PENDING', N'NORMAL', '2026-05-29', '2026-06-10', N'Mehmet Kaya', 0),
        (N'GRV-2026-003', N'e-Fatura entegrasyon testi', N'OVERDUE', N'HIGH', '2026-05-25', '2026-06-02', N'Can Öztürk', 60),
        (N'GRV-2026-004', N'Kasa gün sonu prosedürü', N'COMPLETED', N'LOW', '2026-05-20', '2026-05-22', N'Ali Demir', 100);
END
GO

PRINT N'07-faz3-misc.sql tamamlandı.';
GO
