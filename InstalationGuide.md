# 📥 Como instalar e usar (Super Fácil)

Seus amigos NÃO precisam instalar:

* Node.js
* Python
* FFmpeg
* yt-dlp
* terminal
* npm
* nada técnico

Eles só precisam do arquivo:

## `YTMP3 PRO Setup.exe`

Esse é o instalador final do programa.

---

# 👤 Para quem vai usar o programa (Usuário Final)

## Passo 1 — Receba o instalador

Peça para o desenvolvedor enviar este arquivo:

## `YTMP3 PRO Setup.exe`

Normalmente ele estará dentro da pasta:

```text
dist/
```

Exemplo:

```text
dist/YTMP3 PRO Setup 1.1.0.exe
```

Esse é o único arquivo necessário.

---

## Passo 2 — Clique duas vezes no arquivo

Abra normalmente igual qualquer programa do Windows.

Exemplo:

```text
YTMP3 PRO Setup.exe
```

Se o Windows mostrar aviso de segurança:

### Clique em:

## “Mais informações”

e depois:

## “Executar assim mesmo”

Isso pode acontecer porque o app é independente e não vem da Microsoft Store.

É normal.

---

## Passo 3 — Instale normalmente

A instalação é simples:

```text
Avançar
↓
Avançar
↓
Instalar
↓
Concluir
```

Sem terminal.

Sem código.

Sem complicação.

---

## Passo 4 — Abra o programa

Depois da instalação:

* use o atalho da Área de Trabalho

ou

* procure por:

## YTMP3 PRO

no menu Iniciar do Windows.

---

## Passo 5 — Cole o link do YouTube

Abra o YouTube e copie o link do vídeo.

Exemplo:

```text
https://www.youtube.com/watch?v=XXXXXXXX
```

Depois:

cole esse link dentro do programa.

---

## Passo 6 — Escolha o formato

Você poderá escolher:

* MP3 → mais comum
* WAV → melhor qualidade
* FLAC → qualidade alta
* M4A → bom para Apple/iPhone

Se não souber qual usar:

## escolha MP3

é o melhor para a maioria das pessoas.

---

## Passo 7 — Clique em “Converter Agora”

O programa irá:

* reconhecer o vídeo
* mostrar a capa
* mostrar o título
* baixar o áudio
* converter automaticamente

Você verá a barra de progresso em tempo real.

---

## Passo 8 — Arquivo salvo automaticamente

Quando terminar:

o arquivo será salvo sozinho na sua pasta:

## Downloads

Exemplo:

```text
C:\Users\SeuNome\Downloads
```

Não precisa procurar muito.

Ele estará lá.

---

# 🛠️ Para quem cria o instalador (Desenvolvedor)

## Passo 1 — Coloque os arquivos necessários

Dentro da pasta:

```text
bin/
```

coloque:

```text
yt-dlp.exe
ffmpeg.exe
ffprobe.exe
```

Esses arquivos são obrigatórios.

Sem eles o programa não funciona.

---

## Passo 2 — Abra o terminal na pasta do projeto

Dentro da pasta principal do projeto, rode:

```bash
npm install
npm run build
```

Isso irá gerar o instalador automaticamente.

---

## Passo 3 — Pegue o instalador final

Depois do build, será criada a pasta:

```text
dist/
```

Lá estará:

## `YTMP3 PRO Setup.exe`

Esse é o arquivo que você deve enviar para seus amigos.

Envie apenas ele.

Não precisa enviar o projeto inteiro.

---

# ✅ Resumo rápido

## Desenvolvedor faz:

```text
npm run build
↓
pega o Setup.exe
↓
envia para os amigos
```

## Usuário faz:

```text
baixar Setup.exe
↓
instalar
↓
abrir
↓
colar link
↓
baixar música
```

Simples assim.
