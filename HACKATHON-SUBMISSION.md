# 📝 Instrucciones de Registro - Hackathon 2 La Crypta

## 🎯 Información del Proyecto

**Nombre**: Nostr Kahoot
**Descripción**: Plataforma de cuestionarios interactivos descentralizada en Nostr
**Categoría**: Aplicación Nostr
**Estado**: En desarrollo (MVP)

## 📋 Checklist de Registro

- [ ] Crear repositorio en GitHub con estructura del proyecto
- [ ] Agregar README.md con instrucciones completas
- [ ] Crear rama `develop` para desarrollo
- [ ] Registrar PR en el repositorio del hackathon
- [ ] Configurar GitHub Actions para CI/CD
- [ ] Desplegar en Vercel
- [ ] Documentar endpoints y eventos Nostr
- [ ] Crear video demo (opcional)

## 🔄 Pasos para Registrar el PR

### 1. **Preparar el Repositorio Local**

```bash
# Inicializar git en la carpeta del proyecto
cd nostr-kahoot
git init
git add .
git commit -m "Initial commit: Nostr Kahoot MVP

- Autenticación con NIP-07 (Knoester)
- Sistema de creación de cuestionarios
- Gameplay interactivo en tiempo real
- Eventos Nostr para almacenamiento descentralizado
- Generación de códigos QR compartibles
- Sistema de ranking y puntuación

Co-Authored-By: Hackathon Team <team@lacrypta.io>"
```

### 2. **Crear Repositorio en GitHub**

```bash
# Crear repositorio en GitHub (reemplaza con tu username)
git remote add origin https://github.com/TU-USERNAME/nostr-kahoot.git
git branch -M main
git push -u origin main
```

### 3. **Crear Rama de Desarrollo**

```bash
git checkout -b develop
git push -u origin develop
```

### 4. **Crear PR en el Repositorio del Hackathon**

```bash
# Crear un fork del repo oficial del hackathon
# Luego hacer push de tu rama a tu fork
git remote add hackathon https://github.com/lacrypta/hackathon-2.git
git fetch hackathon
git checkout -b hackathon-submission develop

# Hacer cambios según lo requerido por el hackathon
git push origin hackathon-submission

# Luego crear PR desde GitHub UI hacia:
# Repository: lacrypta/hackathon-2
# Base branch: main
# Head branch: tu-username/hackathon-submission
```

### 5. **Contenido del PR para el Hackathon**

```markdown
## 🎮 Nostr Kahoot

### Descripción
Una plataforma de cuestionarios interactivos completamente descentralizada 
construida sobre Nostr para el segundo hackathon de La Crypta.

### Características Principales
- ✅ Autenticación con Knoester (NIP-07)
- ✅ Creación de cuestionarios con configuración flexible
- ✅ Gameplay interactivo en tiempo real
- ✅ Almacenamiento descentralizado en Nostr
- ✅ Códigos QR compartibles
- ✅ Sistema de ranking en vivo
- ✅ Interfaz responsive (mobile-first)

### Tecnologías
- React 18 + Vite
- nostr-tools (NIP-07)
- Tailwind CSS
- Zustand
- Vercel (deploy)

### Cómo Empezar
```bash
git clone https://github.com/tu-username/nostr-kahoot.git
cd nostr-kahoot
npm install
npm run dev
# Abre http://localhost:3000
```

### Demo en Vivo
🚀 https://nostr-kahoot.vercel.app

### Requisitos
- Extensión Knoester instalada
- Cuenta Nostr activa
- Node.js 18+

### Estructura del Proyecto
```
nostr-kahoot/
├── src/
│   ├── components/      # Componentes React
│   ├── store/          # Zustand stores
│   ├── App.jsx         # Componente raíz
│   ├── main.jsx        # Punto de entrada
│   └── index.css       # Estilos globales
├── index.html          # HTML base
├── package.json        # Dependencias
├── vite.config.js      # Configuración Vite
├── tailwind.config.js  # Configuración Tailwind
└── README.md           # Documentación
```

### Próximas Mejoras
- [ ] Conexión real a relays Nostr
- [ ] Sistema de leaderboards globales
- [ ] Temas personalizables
- [ ] Soporte para múltiples idiomas
- [ ] Integración con pagos en Nostr
- [ ] Tests automatizados

### Notas Técnicas
- Todos los eventos se almacenan en Nostr (KIND 30023 y KIND 1)
- No hay base de datos centralizada
- Cada acción es firmada criptográficamente
- Compatible con cualquier cliente Nostr que soporte NIP-07

---

¡Gracias por revisar Nostr Kahoot! ⚡🎮
```

## 🚀 Deploy en Vercel

```bash
# 1. Conectar repositorio a Vercel
# https://vercel.com/import -> selecciona tu repositorio

# 2. Configurar build settings
# - Build Command: npm run build
# - Output Directory: dist
# - Install Command: npm install

# 3. Desplegar
# Vercel automáticamente despliega cada push a main
```

## 📁 Estructura Final del Repositorio

```
nostr-kahoot/
├── .gitignore
├── .eslintrc.json
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── README.md
├── HACKATHON-SUBMISSION.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── components/
    │   ├── AuthModal.jsx
    │   ├── Dashboard.jsx
    │   ├── QuizCreator.jsx
    │   └── QuizGame.jsx
    └── store/
        ├── authStore.js
        └── quizStore.js
```

## ✅ Checklist Final Antes de Enviar

- [ ] Todo el código está commiteado en git
- [ ] El README es claro y completo
- [ ] El proyecto compila sin errores (`npm run build`)
- [ ] Hay un demo en vivo en Vercel
- [ ] El PR incluye descripción detallada
- [ ] Se incluyen instrucciones de instalación
- [ ] Se documenta cómo usar la app
- [ ] Se explican las dependencias de Nostr
- [ ] El código está lintedo (`npm run lint`)

## 🎯 Información de Contacto

Para preguntas sobre el registro:
- 📧 Email: team@lacrypta.io
- 🔗 Nostr: usa tu pubkey
- 💬 Discord: canal #hackathon-2

---

**¡Buena suerte en el hackathon! 🚀⚡**
