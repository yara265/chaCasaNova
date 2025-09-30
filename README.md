# Chá de Casa Nova - Página PIX

Página simples para listar produtos, selecionar um presente e gerar PIX Copia e Cola e QR Code com o valor do item.

## Como usar

1. Abra `index.html` no navegador.
2. Preencha sua chave PIX no campo "Chave PIX".
3. Clique em "Selecionar" no produto desejado.
4. O payload PIX aparecerá no campo de texto e o QR Code será exibido.
5. Clique em "Copiar" para copiar o PIX Copia e Cola.

## Configurações

- Produtos: edite `PRODUCTS` em `script.js` (nome, descrição, preço).
- Chave PIX padrão: opcionalmente preencha o atributo `value` do input `#pixKey` no `index.html`.
- Nome/Cidade do recebedor: ajuste em `script.js` na chamada de `buildPixPayload`.
- Txid: atualmente `***` (ID 62-05). Personalize em `buildPixPayload` se desejar.

## Tecnologias

- HTML/CSS/JavaScript puro
- QR Code via `qrcode.min.js`
- CRC16/CCITT-FALSE implementado em `script.js`

## Servir localmente (opcional)

```bash
cd /Users/yaran/Developer/cursor_projects/Cha_Casa
python3 -m http.server 5500
```

Acesse `http://localhost:5500`.
