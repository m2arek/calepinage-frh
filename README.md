# Calepinage FRH — mise en ligne

Contenu du dossier :

| Fichier | Rôle |
|---|---|
| `index.html` | L'outil complet (plan 2D, 3D, calepinage, production). |
| `api/pvgis.js` | Relais PVGIS (fonction Vercel, aussi utilisé par `server.js`). |
| `server.js` | Serveur autonome pour votre propre machine ou hébergeur. |

L'outil détecte tout seul si `/api/pvgis` répond. Si oui, la production vient de PVGIS
(données satellite au point GPS exact). Sinon, il utilise son calcul interne.

## Option 1 — Vercel sans ligne de commande (le plus simple)

1. Créez un compte gratuit sur https://github.com puis un dépôt (bouton **New**), par exemple `calepinage-frh`.
2. Dans le dépôt : **Add file › Upload files**, déposez `index.html`, `server.js`, `package.json` et `README.md`, puis **Commit changes**.
3. Toujours dans le dépôt : **Add file › Create new file**. Dans le nom, tapez `api/pvgis.js`
   (le `/` crée le dossier `api`). Collez le contenu du fichier `api/pvgis.js`, puis **Commit changes**.
4. Allez sur https://vercel.com, connectez-vous avec votre compte GitHub.
5. **Add New… › Project**, choisissez le dépôt `calepinage-frh`, laissez les réglages par défaut, cliquez **Deploy**.
6. Au bout d'une minute, Vercel donne l'adresse, par exemple `https://calepinage-frh.vercel.app`.

Pour une mise à jour : remplacez les fichiers dans GitHub, Vercel redéploie automatiquement.

## Option 2 — Vercel en ligne de commande

Avec Node.js installé, dans ce dossier :

```
npx vercel          # première fois : connexion puis questions (tout laisser par défaut)
npx vercel --prod   # mise en production
```

## Option 3 — Votre propre serveur

Il faut Node.js 18 ou plus récent (aucune autre dépendance).

```
node server.js            # écoute sur le port 3000
PORT=8080 node server.js  # autre port
```

En production, placez-le derrière votre serveur web (Nginx, Apache) avec HTTPS,
et lancez-le avec un gestionnaire de processus (pm2, systemd) pour qu'il redémarre seul.

## Vérifier que PVGIS fonctionne

Ouvrez `https://VOTRE-ADRESSE/api/pvgis?lat=48.8566&lon=2.3522&angle=35&aspect=0&loss=14`.
Vous devez voir une réponse avec `monthly` (12 valeurs en kWh/kWc) et `yearly`.

Dans l'outil, le bloc « Site et production » affiche alors une pastille **PVGIS**.

## Paramètres envoyés à PVGIS

- Puissance 1 kWc (l'outil multiplie ensuite par les kWc de chaque pan).
- Inclinaison et azimut de chaque pan (0 = sud, −90 = est, 90 = ouest). Toit plat : inclinaison des supports, plein sud
  (plein nord dans l'hémisphère sud).
- Pertes système : 14 % par défaut (modifiable dans l'outil).
- Montage « libre / ventilé » (`mountingplace=free`).

PVGIS est un service gratuit de la Commission européenne (JRC). Mentionnez la source
« PVGIS © Union européenne » dans les documents remis aux clients.
