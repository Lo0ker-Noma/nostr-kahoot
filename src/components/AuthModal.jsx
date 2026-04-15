import React, { useState } from 'react';
import QRCode from 'qrcode.react';
import { useAuthStore } from '../store/authStore';

export function AuthModal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { initNostr } = useAuthStore();

  const handleConnectWithNostr = async () => {
    setLoading(true);
    setError('');

    const success = await initNostr();
    if (!success) {
      setError('Necesitas tener Knoester u otra extensión Nostr instalada');
    }
    setLoading(false);
  };

  const nostrAuthUri = 'nostr:';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-black/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 space-y-6">
          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="text-6xl">⚡🎮</div>
            <h1 className="text-3xl font-bold text-white">Nostr Kahoot</h1>
            <p className="text-purple-300 text-sm">Cuestionarios descentralizados en Nostr</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Auth Methods */}
          <div className="space-y-4">
            <button
              onClick={handleConnectWithNostr}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition transform hover:scale-105 active:scale-95"
            >
              {loading ? 'Conectando...' : '🔐 Conectar con Knoester'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-500/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black/60 text-purple-300">O escanea un código QR</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center bg-white p-4 rounded-lg">
              <QRCode
                value={nostrAuthUri}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <p className="text-center text-purple-300 text-xs">
              Abre este código QR con Knoester para autenticarte
            </p>
          </div>

          {/* Footer Info */}
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 space-y-2">
            <p className="text-blue-300 text-xs font-semibold">⚙️ Requisitos:</p>
            <ul className="text-blue-200 text-xs space-y-1">
              <li>✓ Extensión Knoester instalada</li>
              <li>✓ Cuenta Nostr activa</li>
              <li>✓ Permiso para firmar eventos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
