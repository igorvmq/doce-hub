using DoceHubApi.Models;
using Microsoft.EntityFrameworkCore;

namespace DoceHubApi.Data;

public class DoceHubDbContext : DbContext
{
    public DoceHubDbContext(DbContextOptions<DoceHubDbContext> options) : base(options) { }

    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Produto> Produtos => Set<Produto>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<PedidoProduto> PedidosProdutos => Set<PedidoProduto>();
    public DbSet<Pagamento> Pagamentos => Set<Pagamento>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.ToTable("categorias");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.IdCategoriaPai).HasColumnName("id_categoria_pai");
            entity.Property(e => e.Nome).HasColumnName("nome").IsRequired().HasMaxLength(100);
            entity.HasOne(e => e.CategoriaPai)
                .WithMany(e => e.CategoriasFilhas)
                .HasForeignKey(e => e.IdCategoriaPai)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Produto>(entity =>
        {
            entity.ToTable("produtos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.IdCategoria).HasColumnName("id_categoria");
            entity.Property(e => e.Nome).HasColumnName("nome").IsRequired().HasMaxLength(150);
            entity.Property(e => e.Descricao).HasColumnName("descricao");
            entity.Property(e => e.Preco).HasColumnName("preco").HasColumnType("decimal(10,2)");
            entity.Property(e => e.ImagemUrl).HasColumnName("imagem_url").HasMaxLength(500);
            entity.Property(e => e.CriadoEm).HasColumnName("criado_em").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.ExcluidoEm).HasColumnName("excluido_em");
            entity.Property(e => e.Desabilitado).HasColumnName("desabilitado").HasDefaultValue(false);
            entity.HasOne(e => e.Categoria)
                .WithMany(e => e.Produtos)
                .HasForeignKey(e => e.IdCategoria)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("usuarios");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Nome).HasColumnName("nome").IsRequired().HasMaxLength(150);
            entity.Property(e => e.Endereco).HasColumnName("endereco");
            entity.Property(e => e.Email).HasColumnName("email").IsRequired().HasMaxLength(150);
            entity.Property(e => e.TelefoneWhatsapp).HasColumnName("telefone_whatsapp").HasMaxLength(30);
            entity.Property(e => e.SenhaHash).HasColumnName("senha_hash").IsRequired().HasMaxLength(255);
            entity.Property(e => e.CriadoEm).HasColumnName("criado_em").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.ExcluidoEm).HasColumnName("excluido_em");
            entity.Property(e => e.Desabilitado).HasColumnName("desabilitado").HasDefaultValue(false);
        });

        modelBuilder.Entity<Pedido>(entity =>
        {
            entity.ToTable("pedidos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.IdUsuario).HasColumnName("id_usuario");
            entity.Property(e => e.NumeroPedido).HasColumnName("numero_pedido").IsRequired().HasMaxLength(20);
            entity.Property(e => e.EntregarEm).HasColumnName("entregar_em");
            entity.Property(e => e.RetiradaLocal).HasColumnName("retirada_local").HasDefaultValue(false);
            entity.Property(e => e.Status).HasColumnName("status").IsRequired().HasMaxLength(30).HasDefaultValue("pendente");
            entity.Property(e => e.ValorTotal).HasColumnName("valor_total").HasColumnType("decimal(10,2)").HasDefaultValue(0m);
            entity.Property(e => e.NomeCliente).HasColumnName("nome_cliente").HasMaxLength(150);
            entity.Property(e => e.Endereco).HasColumnName("endereco");
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(150);
            entity.Property(e => e.TelefoneWhatsapp).HasColumnName("telefone_whatsapp").HasMaxLength(30);
            entity.Property(e => e.CriadoEm).HasColumnName("criado_em").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.ExcluidoEm).HasColumnName("excluido_em");
            entity.HasOne(e => e.Usuario)
                .WithMany(u => u.Pedidos)
                .HasForeignKey(e => e.IdUsuario)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PedidoProduto>(entity =>
        {
            entity.ToTable("pedidos_produtos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.IdPedido).HasColumnName("id_pedido");
            entity.Property(e => e.IdProduto).HasColumnName("id_produto");
            entity.Property(e => e.Quantidade).HasColumnName("quantidade");
            entity.Property(e => e.Observacao).HasColumnName("observacao").HasMaxLength(255);
            entity.Property(e => e.PrecoUnitario).HasColumnName("preco_unitario").HasColumnType("decimal(10,2)");
            entity.Property(e => e.SubtotalItem).HasColumnName("subtotal_item").HasColumnType("decimal(10,2)");
            entity.HasOne(e => e.Pedido)
                .WithMany(o => o.Itens)
                .HasForeignKey(e => e.IdPedido)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Produto)
                .WithMany(p => p.PedidosProdutos)
                .HasForeignKey(e => e.IdProduto)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Pagamento>(entity =>
        {
            entity.ToTable("pagamentos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.IdPedido).HasColumnName("id_pedido");
            entity.Property(e => e.IdPagamentoMp).HasColumnName("id_pagamento_mp").HasMaxLength(100);
            entity.Property(e => e.Status).HasColumnName("status").IsRequired().HasMaxLength(50);
            entity.Property(e => e.DetalheStatus).HasColumnName("detalhe_status").HasMaxLength(255);
            entity.Property(e => e.Valor).HasColumnName("valor").HasColumnType("decimal(10,2)");
            entity.Property(e => e.MetodoPagamento).HasColumnName("metodo_pagamento").HasMaxLength(50);
            entity.Property(e => e.TipoPagamento).HasColumnName("tipo_pagamento").HasMaxLength(50);
            entity.Property(e => e.AprovadoEm).HasColumnName("aprovado_em");
            entity.Property(e => e.CriadoEm).HasColumnName("criado_em").HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.Pedido)
                .WithMany(o => o.Pagamentos)
                .HasForeignKey(e => e.IdPedido)
                .OnDelete(DeleteBehavior.Cascade);
        });

        base.OnModelCreating(modelBuilder);
    }
}
