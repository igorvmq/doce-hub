namespace DoceHubApi.Models;

public class Categoria
{
    public int Id { get; set; }
    public int? IdCategoriaPai { get; set; }
    public Categoria? CategoriaPai { get; set; }
    public ICollection<Categoria> CategoriasFilhas { get; set; } = new List<Categoria>();
    public string Nome { get; set; } = string.Empty;
    public ICollection<Produto> Produtos { get; set; } = new List<Produto>();
}

public class Produto
{
    public int Id { get; set; }
    public int IdCategoria { get; set; }
    public Categoria? Categoria { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public decimal Preco { get; set; }
    public string? ImagemUrl { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime? ExcluidoEm { get; set; }
    public bool Desabilitado { get; set; }
    public ICollection<PedidoProduto> PedidosProdutos { get; set; } = new List<PedidoProduto>();
}

public class Usuario
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Endereco { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? TelefoneWhatsapp { get; set; }
    public string SenhaHash { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; }
    public DateTime? ExcluidoEm { get; set; }
    public bool Desabilitado { get; set; }
    public ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();
}

public class Pedido
{
    public int Id { get; set; }
    public int IdUsuario { get; set; }
    public Usuario? Usuario { get; set; }
    public string NumeroPedido { get; set; } = string.Empty;
    public DateTime? EntregarEm { get; set; }
    public bool RetiradaLocal { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal ValorTotal { get; set; }
    public string? NomeCliente { get; set; }
    public string? Endereco { get; set; }
    public string? Email { get; set; }
    public string? TelefoneWhatsapp { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime? ExcluidoEm { get; set; }
    public ICollection<PedidoProduto> Itens { get; set; } = new List<PedidoProduto>();
    public ICollection<Pagamento> Pagamentos { get; set; } = new List<Pagamento>();
}

public class PedidoProduto
{
    public int Id { get; set; }
    public int IdPedido { get; set; }
    public Pedido? Pedido { get; set; }
    public int IdProduto { get; set; }
    public Produto? Produto { get; set; }
    public int Quantidade { get; set; }
    public string? Observacao { get; set; }
    public decimal PrecoUnitario { get; set; }
    public decimal SubtotalItem { get; set; }
}

public class Pagamento
{
    public int Id { get; set; }
    public int IdPedido { get; set; }
    public Pedido? Pedido { get; set; }
    public string? IdPagamentoMp { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? DetalheStatus { get; set; }
    public decimal Valor { get; set; }
    public string? MetodoPagamento { get; set; }
    public string? TipoPagamento { get; set; }
    public DateTime? AprovadoEm { get; set; }
    public DateTime CriadoEm { get; set; }
}
