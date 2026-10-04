HVU OMEGA R005 — V09.1 AI BRIDGE READY

Cette version aligne la PWA V09 avec un Bridge Cloudflare/OpenAI sécurisé.

Ajouts :
- URL Bridge HTTPS enregistrée dans le Hub.
- Jeton privé HVU stocké uniquement sur l’appareil.
- X-HVU-Token envoyé automatiquement sur les missions.
- Aucune clé OpenAI dans GitHub ou la PWA.
- Aucune bascule locale silencieuse en cas d’erreur Bridge.
- Mode normal jusqu’à 7 rôles ; Conseil jusqu’à 30 rôles avec le Worker V09.1.

Secrets Cloudflare requis :
OPENAI_API_KEY
HVU_BRIDGE_TOKEN

Variable optionnelle :
OPENAI_MODEL

URL prévue :
https://hvu-r005-bridge.samovni11.workers.dev

Statut : CANDIDATE_UNRATIFIED — arbitrage humain obligatoire.
