# ⚡🎮 Nostr Kahoot - Hackathon 2

Kahoot descentralizado construido en **Nostr** para el segundo hackathon de La Crypta.

## 🚀 Características

✅ **Completamente Descentralizado** - Todos los datos en Nostr (sin servidor central)  
✅ **Autenticación con Knoester** - Integración NIP-07 para login seguro  
✅ **Cuestionarios Interactivos** - Crear y compartir quizzes en tiempo real  
✅ **Eventos Nostr** - Respuestas y resultados firmados criptográficamente  
✅ **QR Compartible** - Genera códigos QR para que otros se unan  
✅ **Ranking en Vivo** - Sistema de puntuación en tiempo real  
✅ **Responsive Design** - Optimizado para mobile y desktop  

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Autenticación**: nostr-tools (NIP-07)
- **Estado**: Zustand
- **Estilos**: Tailwind CSS
- **QR**: qrcode.react
- **Deploy**: Vercel

## 📋 Requisitos Previos

- Node.js 18+ y npm/yarn
- Extensión Knoester (o cualquier cliente Nostr con NIP-07)
- Cuenta Nostr activa

## 🚀 Instalación Rápida

```bash
# 1. Clonar el repositorio
git clone <tu-repo-url>
cd nostr-kahoot

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en el navegador
# http://localhost:3000
```

## 📦 Scripts Disponibles

```bash
npm run dev       # Iniciar servidor Vite en desarrollo
npm run build     # Construir para producción
npm run preview   # Preview de la build
npm run lint      # Ejecutar linter
```

## 🔐 Flujo de Autenticación

1. **Usuario accede** → Se le muestra pantalla de login
2. **Conecta con Knoester** → Click en "Conectar con Knoester"
3. **Aprueba permiso** → Autoriza la extensión en su navegador
4. **Entra automáticamente** → Obtiene su perfil y puede crear/jugar
5. **Todas las acciones se firman** → Cada quiz y respuesta son eventos Nostr

## 🎮 Cómo Usar

### Crear un Quiz

1. Click en "✏️ Crear Quiz"
2. Completa título y descripción
3. Añade preguntas con 4 opciones de respuesta
4. Selecciona la respuesta correcta
5. Elige dificultad (Fácil/Medio/Difícil)
6. Click en "🚀 Publicar Quiz en Nostr"
7. Se generará automáticamente un QR para compartir

### Jugar un Quiz

1. Click en "🎮 Unirse a Quiz"
2. Ingresa el ID de la sesión O escanea el código QR
3. Responde cada pregunta
4. Ve tu puntuación final

## 📱 Compartir en Knoester

Una vez que publicas un quiz:

1. Genera el código QR desde el dashboard
2. Comparte el QR en Knoester
3. Otros usuarios escanean y se unen automáticamente
4. Los resultados se guardan en la blockchain de Nostr

## 🔗 Integración Nostr

### Eventos que se crean:

**KIND 30023 (Contenido)** - Quizzes
```
{
  "title": "Nombre del Quiz",
  "description": "...",
  "questions": [...],
  "creator": "pubkey",
  "createdAt": "timestamp"
}
```

**KIND 1 (Nota corta)** - Respuestas
```
{
  "quizId": "...",
  "questionId": "...",
  "answer": 0,
  "correct": true,
  "timestamp": "..."
}
```

## 🚢 Deploy en Vercel

```bash
# 1. Push a GitHub
git push origin main

# 2. Conectar con Vercel
# Vercel automáticamente detectará vite.config.js

# 3. Deploy automático
# Cada push a main despliega automáticamente
```

**URL de producción**: `https://nostr-kahoot.vercel.app`

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Notas Técnicas

- Los datos se guardan en Nostr, no en una base de datos centralizada
- Cada usuario firma sus acciones con su clave privada de Nostr
- Los relays Nostr sincronizarán los datos entre clientes
- El frontend es completamente stateless

## 🐛 Debugging

```bash
# Ver eventos Nostr en la consola
# Abre DevTools (F12) → Console

# Verificar que Knoester está instalada
console.log(window.nostr)

# Test de firma de eventos
await window.nostr.signEvent({kind: 1, content: "test", ...})
```

## 📞 Soporte

Para issues o preguntas:
- Abre un GitHub Issue
- Contacta en Nostr: @nostr-kahoot
- Mensaje en Knoester

## 📄 Licencia

MIT License - sé libre de usar, modificar y distribuir

---

**¡Hecho para La Crypta Hackathon 2! ⚡🚀**

Construido con ❤️ en Nostr
