# Publicar no GitHub Pages (passo a passo)

Este ambiente do agente **não tem login no GitHub**. Rode estes comandos na sua máquina (com `gh` autenticado) a partir da pasta do projeto:

```bash
cd ong-asa

# 1) Crie o repositório e envie o código
gh repo create ong-asa --public --source=. --remote=origin --push

# Se o remote local ainda apontar para outro lugar:
# git remote remove origin
# git remote add origin https://github.com/SEU_USUARIO/ong-asa.git
# git push -u origin main

# 2) Ative o GitHub Pages via Actions
# No GitHub: Settings → Pages → Source = GitHub Actions

# 3) O workflow .github/workflows/deploy.yml publica automaticamente
# Após o primeiro Actions verde, o site fica em:
# https://SEU_USUARIO.github.io/ong-asa/
```

Credenciais do painel demo: `admin@ongasa.org.br` / `asa2025`
