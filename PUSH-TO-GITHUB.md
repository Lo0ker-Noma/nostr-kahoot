# 🚀 Guía Rápida: Push a GitHub y Registro en Hackathon

El repositorio local está listo con **1 commit inicial**. Sigue estos pasos:

---

## ✅ Paso 1: Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre del repo: `nostr-kahoot`
3. Descripción: `Kahoot descentralizado en Nostr para hackathones`
4. Selecciona: **Public** (para que el hackathon pueda verlo)
5. NO inicialices con README (ya tenemos uno)
6. Click en "Create repository"

---

## 📌 Paso 2: Conectar el Repo Local a GitHub

Copia y ejecuta estos comandos en tu terminal:

```bash
# Navega a la carpeta del proyecto
cd ruta/donde/descargaste/nostr-kahoot

# Añade el remote de GitHub (reemplaza TU-USERNAME)
git remote add origin https://github.com/TU-USERNAME/nostr-kahoot.git

# Verifica que se agregó correctamente
git remote -v
# Deberías ver:
# origin  https://github.com/TU-USERNAME/nostr-kahoot.git (fetch)
# origin  https://github.com/TU-USERNAME/nostr-kahoot.git (push)

# Push del código a GitHub
git push -u origin main

# Verifica que está en GitHub
# Abre https://github.com/TU-USERNAME/nostr-kahoot
```

---

## 🔗 Paso 3: Registrar PR en el Hackathon

### Opción A: Si el hackathon tiene un repo oficial

```bash
# 1. Fork del repo oficial del hackathon
# Ve a: https://github.com/lacrypta/hackathon-2
# Click en "Fork"

# 2. En tu computadora, crea una rama para el submission
git checkout -b hackathon-submission

# 3. Agrega el remote del hackathon
git remote add hackathon https://github.com/lacrypta/hackathon-2.git

# 4. Push a tu fork
git push origin hackathon-submission

# 5. En GitHub, abre un PR desde tu fork hacia lacrypta/hackathon-2
# - Título: "🎮 Nostr Kahoot - Hackathon 2 Submission"
# - Description: Usa el template en HACKATHON-SUBMISSION.md
```

### Opción B: Si crean una issue de submissions

```bash
# Comenta en la issue con:
- Nombre del proyecto: Nostr Kahoot
- Repositorio: https://github.com/TU-USERNAME/nostr-kahoot
- Demo en vivo: https://nostr-kahoot.vercel.app (después de desplegar)
- Descripción corta con features principales
```

---

## 🚢 Paso 4: Desplegar en Vercel (Opcional pero Recomendado)

1. Ve a https://vercel.com
2. Click en "Add New..." → "Project"
3. Importa tu repositorio de GitHub
4. Settings automáticos (Vercel detecta Vite):
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click "Deploy"
6. Vercel te dará una URL como: `https://nostr-kahoot-YOUR-NAME.vercel.app`

**Cada push a `main` se despliega automáticamente** ✨

---

## 📋 Checklist Final

- [ ] Repositorio creado en GitHub
- [ ] Código pusheado a `main`
- [ ] PR registrado en el hackathon
- [ ] Demo en vivo en Vercel (opcional)
- [ ] README actualizado si es necesario
- [ ] Se menciona que requiere Knoester instalado

---

## 🔍 Verificar que Todo Está Bien

```bash
# Ver commits
git log --oneline

# Ver remote configurado
git remote -v

# Ver rama actual
git branch -a

# Ver archivos tracked
git ls-files
```

---

## 📱 Commits Que Ya Tenemos

```
4012071 Initial commit: Nostr Kahoot MVP
```

Con 18 archivos:
- ✅ Todos los componentes React
- ✅ Stores (auth, quiz)
- ✅ Configuración (Vite, Tailwind, PostCSS)
- ✅ HTML, CSS, package.json
- ✅ README y documentación

---

## 🎯 Estado del Proyecto

**Listo para**: 
- ✅ Push a GitHub
- ✅ Desplegar en Vercel
- ✅ Registrar en hackathon
- ✅ Compartir con el equipo

**Próximas mejoras** (después de registrar):
- [ ] Conexión real a relays Nostr
- [ ] Tests automatizados
- [ ] CI/CD con GitHub Actions
- [ ] Más features según feedback

---

## 💬 Si Tienes Problemas

**Error: "fatal: remote origin already exists"**
```bash
git remote remove origin
git remote add origin https://github.com/TU-USERNAME/nostr-kahoot.git
```

**Error: "rejected ... because the remote contains work that you do"**
```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

**¿Olvidaste qué es TU-USERNAME?**
- Ve a https://github.com/settings/profile
- Verás tu username en la URL

---

**¡Ya está todo listo para despegar! 🚀⚡**

Cualquier duda, aquí estoy 👋
