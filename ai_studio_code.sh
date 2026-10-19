# 1. Verifique se o git está ativo ou inicialize
git init

# 2. Adicione o seu repositório do GitHub como origin (se ainda não estiver configurado)
git remote add origin https://github.com/SEU_UTILIZADOR/SEU_REPOSITORIO.git

# 3. Adicione todos os ficheiros atualizados
git add .

# 4. Crie o commit das alterações
git commit -m "feat: Pitstop Loyalty Club com NFC Tap, PIN seguro e Vercel config"

# 5. Envie para o GitHub
git branch -M main
git push -u origin main