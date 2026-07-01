using DoceHubApi.Data;
using DoceHubApi.Models;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Json;
using System.Linq;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);



builder.Services.AddDbContextPool<DoceHubDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Server=localhost;Port=3306;Database=doce_hub_db;User=docehub;Password=docehub123!@#;";
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
});

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.SerializerOptions.WriteIndented = true;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
         policy
            .WithOrigins(
                "https://doce-hub.vercel.app",
                "http://localhost:3000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowFrontend");

app.MapGet("/", () => Results.Ok(new { Message = "Doce Hub API is running" }));
app.MapGet("/health", () => Results.Ok("Healthy"));

app.MapGet("/categorias", async (DoceHubDbContext db) =>
    await db.Categorias.Include(c => c.CategoriaPai).AsNoTracking().ToListAsync());

app.MapGet("/categorias/{id}", async (int id, DoceHubDbContext db) =>
    await db.Categorias.Include(c => c.CategoriaPai).AsNoTracking().FirstOrDefaultAsync(c => c.Id == id)
        is Categoria categoria ? Results.Ok(categoria) : Results.NotFound());

app.MapPost("/categorias", async (Categoria categoria, DoceHubDbContext db) =>
{
    db.Categorias.Add(categoria);
    await db.SaveChangesAsync();
    return Results.Created($"/categorias/{categoria.Id}", categoria);
});

app.MapPut("/categorias/{id}", async (int id, Categoria input, DoceHubDbContext db) =>
{
    var categoria = await db.Categorias.FindAsync(id);
    if (categoria is null) return Results.NotFound();

    categoria.Nome = input.Nome;
    categoria.IdCategoriaPai = input.IdCategoriaPai;
    await db.SaveChangesAsync();

    return Results.NoContent();
});

app.MapDelete("/categorias/{id}", async (int id, DoceHubDbContext db) =>
{
    var categoria = await db.Categorias.FindAsync(id);
    if (categoria is null) return Results.NotFound();

    db.Categorias.Remove(categoria);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapGet("/produtos", async (DoceHubDbContext db) =>
    await db.Produtos.Include(p => p.Categoria).AsNoTracking().ToListAsync());

app.MapGet("/produtos/{id}", async (int id, DoceHubDbContext db) =>
    await db.Produtos.Include(p => p.Categoria).AsNoTracking().FirstOrDefaultAsync(p => p.Id == id)
        is Produto produto ? Results.Ok(produto) : Results.NotFound());

app.MapPost("/produtos", async (Produto produto, DoceHubDbContext db) =>
{
    if (!await db.Categorias.AnyAsync(c => c.Id == produto.IdCategoria))
    {
        return Results.BadRequest(new { Error = "Categoria não encontrada." });
    }

    db.Produtos.Add(produto);
    await db.SaveChangesAsync();
    return Results.Created($"/produtos/{produto.Id}", produto);
});

app.MapPut("/produtos/{id}", async (int id, Produto input, DoceHubDbContext db) =>
{
    var produto = await db.Produtos.FindAsync(id);
    if (produto is null) return Results.NotFound();

    if (!await db.Categorias.AnyAsync(c => c.Id == input.IdCategoria))
    {
        return Results.BadRequest(new { Error = "Categoria não encontrada." });
    }

    produto.Nome = input.Nome;
    produto.Descricao = input.Descricao;
    produto.Preco = input.Preco;
    produto.ImagemUrl = input.ImagemUrl;
    produto.IdCategoria = input.IdCategoria;
    produto.Desabilitado = input.Desabilitado;
    await db.SaveChangesAsync();

    return Results.NoContent();
});

app.MapDelete("/produtos/{id}", async (int id, DoceHubDbContext db) =>
{
    var produto = await db.Produtos.FindAsync(id);
    if (produto is null) return Results.NotFound();

    db.Produtos.Remove(produto);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapGet("/usuarios", async (DoceHubDbContext db) =>
    await db.Usuarios.AsNoTracking().ToListAsync());

app.MapGet("/usuarios/{id}", async (int id, DoceHubDbContext db) =>
    await db.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id)
        is Usuario usuario ? Results.Ok(usuario) : Results.NotFound());

app.MapPost("/usuarios", async (Usuario usuario, DoceHubDbContext db) =>
{
    if (await db.Usuarios.AnyAsync(u => u.Email == usuario.Email))
    {
        return Results.Conflict(new { Error = "Email já cadastrado." });
    }

    db.Usuarios.Add(usuario);
    await db.SaveChangesAsync();
    return Results.Created($"/usuarios/{usuario.Id}", usuario);
});

app.MapPut("/usuarios/{id}", async (int id, Usuario input, DoceHubDbContext db) =>
{
    var existing = await db.Usuarios.FindAsync(id);
    if (existing is null) return Results.NotFound();

    existing.Nome = input.Nome;
    existing.Endereco = input.Endereco;
    existing.Email = input.Email;
    existing.TelefoneWhatsapp = input.TelefoneWhatsapp;
    existing.SenhaHash = input.SenhaHash;
    existing.Desabilitado = input.Desabilitado;
    await db.SaveChangesAsync();

    return Results.NoContent();
});

app.MapDelete("/usuarios/{id}", async (int id, DoceHubDbContext db) =>
{
    var existing = await db.Usuarios.FindAsync(id);
    if (existing is null) return Results.NotFound();

    db.Usuarios.Remove(existing);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapGet("/pedidos", async (int? page, int? pageSize, DoceHubDbContext db) =>
{
    var pg = (page ?? 1);
    var ps = (pageSize ?? 100);
    IQueryable<Pedido> query = db.Pedidos
        .Include(o => o.Usuario)
        .Include(o => o.Itens).ThenInclude(i => i.Produto)
        .Include(o => o.Pagamentos)
        .AsNoTracking()
        .OrderByDescending(o => o.CriadoEm);

    if (ps > 0)
    {
        query = query.Skip((pg - 1) * ps).Take(ps);
    }

    return await query.ToListAsync();
});

app.MapGet("/pedidos/{id}", async (int id, DoceHubDbContext db) =>
    await db.Pedidos
        .Include(o => o.Usuario)
        .Include(o => o.Itens).ThenInclude(i => i.Produto)
        .Include(o => o.Pagamentos)
        .AsNoTracking()
        .FirstOrDefaultAsync(o => o.Id == id)
        is Pedido pedido ? Results.Ok(pedido) : Results.NotFound());

app.MapGet("/pedidos/{pedidoId}/itens", async (int pedidoId, DoceHubDbContext db) =>
    await db.PedidosProdutos
        .Include(i => i.Produto)
        .Where(i => i.IdPedido == pedidoId)
        .AsNoTracking()
        .ToListAsync());

app.MapGet("/pedidos/{pedidoId}/pagamentos", async (int pedidoId, DoceHubDbContext db) =>
    await db.Pagamentos
        .Where(p => p.IdPedido == pedidoId)
        .AsNoTracking()
        .ToListAsync());

app.MapPost("/pedidos", async (CriarPedidoRequest request, DoceHubDbContext db) =>
{
    if (!await db.Usuarios.AnyAsync(u => u.Id == request.IdUsuario))
    {
        return Results.BadRequest(new { Error = "Usuário não encontrado." });
    }

    if (request.Itens is null || request.Itens.Count == 0)
    {
        return Results.BadRequest(new { Error = "O pedido precisa ter ao menos um item." });
    }

    var pedido = new Pedido
    {
        IdUsuario = request.IdUsuario,
        NumeroPedido = string.IsNullOrWhiteSpace(request.NumeroPedido)
            ? $"ORD-{Guid.NewGuid():N}".Substring(0, 20)
            : request.NumeroPedido,
        EntregarEm = request.EntregarEm,
        RetiradaLocal = request.RetiradaLocal,
        Status = string.IsNullOrWhiteSpace(request.Status) ? "pendente" : request.Status,
        NomeCliente = request.NomeCliente,
        Endereco = request.Endereco,
        Email = request.Email,
        TelefoneWhatsapp = request.TelefoneWhatsapp,
        Itens = new List<PedidoProduto>()
    };

    foreach (var item in request.Itens)
    {
        var produto = await db.Produtos.FindAsync(item.IdProduto);
        if (produto is null)
        {
            return Results.BadRequest(new { Error = $"Produto {item.IdProduto} não encontrado." });
        }

        var subtotal = produto.Preco * item.Quantidade;
        pedido.Itens.Add(new PedidoProduto
        {
            IdProduto = produto.Id,
            Quantidade = item.Quantidade,
            Observacao = item.Observacao,
            PrecoUnitario = produto.Preco,
            SubtotalItem = subtotal
        });
    }

    pedido.ValorTotal = pedido.Itens.Sum(i => i.SubtotalItem);
    db.Pedidos.Add(pedido);
    await db.SaveChangesAsync();

    return Results.Created($"/pedidos/{pedido.Id}", pedido);
});

app.MapPut("/pedidos/{id}", async (int id, AtualizarPedidoRequest request, DoceHubDbContext db) =>
{
    var pedido = await db.Pedidos.FindAsync(id);
    if (pedido is null) return Results.NotFound();

    pedido.Status = request.Status ?? pedido.Status;
    pedido.EntregarEm = request.EntregarEm ?? pedido.EntregarEm;
    pedido.RetiradaLocal = request.RetiradaLocal;
    pedido.NomeCliente = request.NomeCliente ?? pedido.NomeCliente;
    pedido.Endereco = request.Endereco ?? pedido.Endereco;
    pedido.Email = request.Email ?? pedido.Email;
    pedido.TelefoneWhatsapp = request.TelefoneWhatsapp ?? pedido.TelefoneWhatsapp;

    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapDelete("/pedidos/{id}", async (int id, DoceHubDbContext db) =>
{
    var pedido = await db.Pedidos.FindAsync(id);
    if (pedido is null) return Results.NotFound();

    pedido.ExcluidoEm = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapGet("/pagamentos", async (DoceHubDbContext db) =>
    await db.Pagamentos.Include(p => p.Pedido).AsNoTracking().ToListAsync());

app.MapGet("/pagamentos/{id}", async (int id, DoceHubDbContext db) =>
    await db.Pagamentos.Include(p => p.Pedido).AsNoTracking().FirstOrDefaultAsync(p => p.Id == id)
        is Pagamento pagamento ? Results.Ok(pagamento) : Results.NotFound());

app.MapPost("/pagamentos", async (Pagamento pagamento, DoceHubDbContext db) =>
{
    if (!await db.Pedidos.AnyAsync(o => o.Id == pagamento.IdPedido))
    {
        return Results.BadRequest(new { Error = "Pedido não encontrado." });
    }

    db.Pagamentos.Add(pagamento);
    await db.SaveChangesAsync();
    return Results.Created($"/pagamentos/{pagamento.Id}", pagamento);
});

app.MapPost("/checkout/mercadopago", async (CriarPedidoCheckoutRequest request, DoceHubDbContext db, IHttpClientFactory httpClientFactory, IConfiguration config) =>
{
    // Adicionar log temporário para debug
    Console.WriteLine($"[DEBUG] Request recebido:");
    Console.WriteLine($"  - Email: {request.Email}");
    Console.WriteLine($"  - SuccessUrlBase: {request.SuccessUrlBase}");
    Console.WriteLine($"  - FailureUrlBase: {request.FailureUrlBase}");
    Console.WriteLine($"  - PendingUrlBase: {request.PendingUrlBase}");
    Console.WriteLine($"  - Itens: {request.Itens?.Count ?? 0}");

    if (request.Itens is null || request.Itens.Count == 0)
    {
        return Results.BadRequest(new { Error = "O pedido precisa ter ao menos um item." });
    }

    if (string.IsNullOrWhiteSpace(request.Email))
    {
        return Results.BadRequest(new { Error = "Email do cliente é obrigatório para o checkout." });
    }

    if (string.IsNullOrWhiteSpace(request.NomeCliente))
    {
        return Results.BadRequest(new { Error = "Nome do cliente é obrigatório." });
    }

    Usuario usuario;
    if (request.IdUsuario > 0)
    {
        usuario = await db.Usuarios.FindAsync(request.IdUsuario);
        if (usuario is null)
        {
            return Results.BadRequest(new { Error = "Usuário não encontrado." });
        }
    }
    else
    {
        usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email) ?? new Usuario
        {
            Nome = request.NomeCliente,
            Email = request.Email,
            TelefoneWhatsapp = request.TelefoneWhatsapp,
            Endereco = request.RetiradaLocal ? null : request.Endereco,
            SenhaHash = string.Empty,
            CriadoEm = DateTime.UtcNow,
        };

        if (usuario.Id == 0)
        {
            db.Usuarios.Add(usuario);
            await db.SaveChangesAsync();
        }
    }

    var pedido = new Pedido
    {
        IdUsuario = usuario.Id,
        NumeroPedido = string.IsNullOrWhiteSpace(request.NumeroPedido)
            ? $"ORD-{Guid.NewGuid():N}".Substring(0, 20)
            : request.NumeroPedido,
        EntregarEm = request.EntregarEm,
        RetiradaLocal = request.RetiradaLocal,
        Status = "pendente",
        NomeCliente = request.NomeCliente,
        Endereco = request.RetiradaLocal ? null : request.Endereco,
        Email = request.Email,
        TelefoneWhatsapp = request.TelefoneWhatsapp,
        CriadoEm = DateTime.UtcNow,
        Itens = new List<PedidoProduto>()
    };

    var mpItems = new List<object>();
    foreach (var item in request.Itens)
    {
        var produto = await db.Produtos.FindAsync(item.IdProduto);
        if (produto is null)
        {
            return Results.BadRequest(new { Error = $"Produto {item.IdProduto} não encontrado." });
        }

        var subtotal = produto.Preco * item.Quantidade;
        pedido.Itens.Add(new PedidoProduto
        {
            IdProduto = produto.Id,
            Quantidade = item.Quantidade,
            Observacao = item.Observacao,
            PrecoUnitario = produto.Preco,
            SubtotalItem = subtotal
        });

        mpItems.Add(new
        {
            title = produto.Nome,
            quantity = item.Quantidade,
            unit_price = produto.Preco,
            currency_id = "BRL",
            description = item.Observacao ?? string.Empty
        });
    }

    pedido.ValorTotal = pedido.Itens.Sum(i => i.SubtotalItem);
    db.Pedidos.Add(pedido);
    await db.SaveChangesAsync();

    var backUrls = new Dictionary<string, string>();
    if (!string.IsNullOrWhiteSpace(request.SuccessUrlBase))
    {
        //backUrls["success"] = "https://google.com";
        backUrls["success"] = $"{request.SuccessUrlBase}?pedidoId={pedido.Id}&status=approved";
    }
    if (!string.IsNullOrWhiteSpace(request.FailureUrlBase))
    {
        backUrls["failure"] = $"{request.FailureUrlBase}?pedidoId={pedido.Id}&status=failed";
    }
    if (!string.IsNullOrWhiteSpace(request.PendingUrlBase))
    {
        backUrls["pending"] = $"{request.PendingUrlBase}?pedidoId={pedido.Id}&status=pending";
    }

    var accessToken = config["MercadoPago:AccessToken"];
    if (string.IsNullOrWhiteSpace(accessToken))
    {
        return Results.Problem("Token de Mercado Pago não configurado.", statusCode: 500);
    }

    if (string.IsNullOrWhiteSpace(request.SuccessUrlBase))
    {
        return Results.BadRequest(new { Error = "SuccessUrlBase é obrigatório para o checkout do Mercado Pago." });
    }

    var mpRequest = new MercadoPagoPreferenceRequest
    {
        Items = mpItems,
        Payer = new MercadoPagoPayer
        {
            Email = request.Email,
            Name = request.NomeCliente
        },
        BackUrls = backUrls,
        AutoReturn = "approved",
        ExternalReference = pedido.Id.ToString(),
        StatementDescriptor = "DoceHub"
    };

    // Log JSON enviado ao Mercado Pago
    var options = new System.Text.Json.JsonSerializerOptions { WriteIndented = true, DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull };
    var jsonLog = System.Text.Json.JsonSerializer.Serialize(mpRequest, options);
    Console.WriteLine($"[DEBUG] JSON enviado ao Mercado Pago:\n{jsonLog}");

    var client = httpClientFactory.CreateClient();
    client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
    var mpResponse = await client.PostAsJsonAsync("https://api.mercadopago.com/checkout/preferences", mpRequest);
    //var responseContent = await mpResponse.Content.ReadAsStringAsync();
    if (!mpResponse.IsSuccessStatusCode)
    {
        var errorBody = await mpResponse.Content.ReadAsStringAsync();
        return Results.BadRequest(new { Error = errorBody+ "Falha ao criar preferência Mercado Pago.", Detail = errorBody });
    }

    var mpResponseBody = await mpResponse.Content.ReadFromJsonAsync<MercadoPagoPreferenceResponse>();
    if (mpResponseBody is null || string.IsNullOrWhiteSpace(mpResponseBody.InitPoint))
    {
        return Results.Problem("Resposta inválida do Mercado Pago.", statusCode: 500);
    }

    db.Pagamentos.Add(new Pagamento
    {
        IdPedido = pedido.Id,
        IdPagamentoMp = mpResponseBody.Id,
        Status = mpResponseBody.Status ?? "iniciada",
        DetalheStatus = mpResponseBody.StatusDetail,
        Valor = pedido.ValorTotal,
        MetodoPagamento = "checkout",
        TipoPagamento = "mercadopago",
        CriadoEm = DateTime.UtcNow
    });

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        checkoutUrl = mpResponseBody.InitPoint,
        pedidoId = pedido.Id,
        numeroPedido = pedido.NumeroPedido
    });
});

app.MapPut("/pagamentos/{id}", async (int id, Pagamento update, DoceHubDbContext db) =>
{
    var pagamento = await db.Pagamentos.FindAsync(id);
    if (pagamento is null) return Results.NotFound();

    pagamento.Status = update.Status;
    pagamento.DetalheStatus = update.DetalheStatus;
    pagamento.Valor = update.Valor;
    pagamento.MetodoPagamento = update.MetodoPagamento;
    pagamento.TipoPagamento = update.TipoPagamento;
    pagamento.AprovadoEm = update.AprovadoEm;
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.Run();

public class CriarPedidoRequest
{
    public int IdUsuario { get; set; }
    public string? NumeroPedido { get; set; }
    public DateTime? EntregarEm { get; set; }
    public bool RetiradaLocal { get; set; }
    public string? Status { get; set; }
    public string? NomeCliente { get; set; }
    public string? Endereco { get; set; }
    public string? Email { get; set; }
    public string? TelefoneWhatsapp { get; set; }
    public List<CriarPedidoItemRequest> Itens { get; set; } = new();
}

public class CriarPedidoItemRequest
{
    public int IdProduto { get; set; }
    public int Quantidade { get; set; }
    public string? Observacao { get; set; }
}

public class AtualizarPedidoRequest
{
    public string? Status { get; set; }
    public DateTime? EntregarEm { get; set; }
    public bool RetiradaLocal { get; set; }
    public string? NomeCliente { get; set; }
    public string? Endereco { get; set; }
    public string? Email { get; set; }
    public string? TelefoneWhatsapp { get; set; }
}

public class CriarPedidoCheckoutRequest
{
    public int IdUsuario { get; set; }
    public string? NumeroPedido { get; set; }
    public DateTime? EntregarEm { get; set; }
    public bool RetiradaLocal { get; set; }
    public string? Status { get; set; }
    public string? NomeCliente { get; set; }
    public string? Endereco { get; set; }
    public string? Email { get; set; }
    public string? TelefoneWhatsapp { get; set; }
    [JsonPropertyName("successUrlBase")]
    public string? SuccessUrlBase { get; set; }

    [JsonPropertyName("failureUrlBase")]
    public string? FailureUrlBase { get; set; }

    [JsonPropertyName("pendingUrlBase")]
    public string? PendingUrlBase { get; set; }

    public List<CriarPedidoItemRequest> Itens { get; set; } = new();
}

public class MercadoPagoPreferenceResponse
{
[JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("status_detail")]
    public string? StatusDetail { get; set; }

    [JsonPropertyName("init_point")]
    public string? InitPoint { get; set; }

    [JsonPropertyName("sandbox_init_point")]
    public string? SandboxInitPoint { get; set; }
}

public class MercadoPagoPreferenceRequest
{
    [JsonPropertyName("items")]
    public List<object> Items { get; set; } = new();

    [JsonPropertyName("payer")]
    public MercadoPagoPayer Payer { get; set; } = new();

    [JsonPropertyName("back_urls")]
    public Dictionary<string, string> BackUrls { get; set; } = new();

    [JsonPropertyName("auto_return")]
    public string AutoReturn { get; set; } = string.Empty;

    [JsonPropertyName("external_reference")]
    public string ExternalReference { get; set; } = string.Empty;

    [JsonPropertyName("statement_descriptor")]
    public string StatementDescriptor { get; set; } = string.Empty;
}

public class MercadoPagoPayer
{
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

