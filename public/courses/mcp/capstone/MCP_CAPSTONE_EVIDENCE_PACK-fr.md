# MCP Cours 10 — Pack de preuves Capstone

> Cette édition est entièrement traduite à partir de la source anglaise et a passé avec succès les contrôles automatisés de structure et de terminologie technique. La révision linguistique humaine n’est pas revendiquée.

Base de référence du protocole : MCP `2026-07-28`<br>
Version d'évaluation du cours : `2026-07-28-v2`<br>
Aperçu des preuves du cours : `2026-08-24`

Ce modèle prend en charge soit la piste constructeur (implémenter un petit serveur et un petit client), soit la piste auditeur (reproduire et réviser un serveur public). Le remplir constitue une auto-attestation et non un certificat vérifié de manière indépendante. Supprimez tous les secrets et données privées avant de les partager.

## 1. Décision appropriée

- Utilisateur et travail :
- Pourquoi MCP plutôt qu'une API directe ou une fonction ordinaire :
- Surface de capacité minimale :
- Non-objectifs explicites :
- Autorité introduite :

## 2. Architecture et flux de données

Joignez un diagramme montrant l'utilisateur, le modèle, l'hôte, un client MCP par serveur, les serveurs, les systèmes en amont, les transports, les informations d'identification, les journaux et l'état stocké. Pour chaque Edge, indiquez quelles données le traversent et qui peut les conserver.

## 3. Manifeste de version

| Article | Version exacte ou révision immuable | Source | Date vérifiée |
| --- | --- | --- | --- |
| Protocole MCP | 2026-07-28 |  |  |
| SDK |  |  |  |
| Serveur |  |  |  |
| Hôte/client |  |  |  |
| Runtime et fichier de verrouillage |  |  |  |

## 4. Contrats de capacité

Pour chaque outil, ressource, invite, sollicitation et extension négociée, enregistrez :

- nom ou URI ;
- propriétaire de l'interaction ;
- schéma d'entrée et de sortie ;
- règle d'autorisation et d'approbation ;
- comportement normal, vide, invalide, non autorisé, conflit, délai d'attente et échec en amont ;
- les preuves sont retournées ;
- restauration ou compensation pour les écritures.

## 5. Preuve directe du protocole

- `server/discover` request/response avec les métadonnées actuelles par requête et `resultType` ;
- traces primitives list/read/get/call ;
- traces de défaillances normales et attendues ;
- journal de rédaction ;
- remarque pour toute interface utilisateur Legacy Inspector qui est conservée uniquement à titre de preuve historique.

## 6. Preuve d'intégration de l'hôte

- nom d'hôte et version exacte ;
- transport configuré et identité du serveur ;
- protocole et capacités négociés ;
- liste d'autorisation et politique d'approbation des outils efficaces ;
- un flux de travail en lecture seule réussi ;
- un workflow refusé ou en échec attendu.

## 7. Modèle de menace et tests contradictoires

Exécutez les 12 cas nommés ci-dessous. Si une ligne combine des variantes associées, exercez chaque variante et conservez des observations distinctes dans cette ligne.

| Cas | Actif ou limite | Contrôle forcé | Signal attendu | Résultat observé |
| --- | --- | --- | --- | --- |
| 1 | Injection rapide ou de résultat | Conserver le contenu renvoyé dans un canal de données non fiable | L'injection ne peut pas modifier la politique de priorité supérieure |  |
| 2 | Annotations hostiles ou instructions cachées | Traitez les annotations comme des indices ; inspecter les blocs de contenu | Aucune autorité ou élévation politique |  |
| 3 | Traversée du chemin | Canoniser et contraindre les chemins autorisés | Chemin hors champ rejeté |  |
| 4 | Contenu surdimensionné | Appliquer les limites d'octets, d'éléments et de contexte | Rejet limité ou signal de troncature sécurisé |  |
| 5 | Contournement de schéma ou champs inconnus | Valider le schéma JSON et rejeter les extras | Résultat déterministe des paramètres invalides |  |
| 6 | Mauvaise audience ou transfert de jeton | Valider l'audience ; ne transmettez jamais les jetons client en amont | Demande refusée sans fuite de jeton |  |
| 7 | Redirection, SSRF ou rereliure DNS | Ajouter les destinations à la liste blanche et revalider chaque saut | Cible interne ou non autorisée bloquée |  |
| 8 | Relecture de la poignée d'état | Utilisez des identifiants imprévisibles et réautorisez chaque demande | Relecture inter-utilisateurs ou expirée refusée |  |
| 9 | Écriture en double | Idempotence ou garde de révision exacte | Au plus un changement prévu |  |
| 10 | Course d'annulation | Annulation coopérative et contrôle d'état post-annulation | Aucun effet secondaire tardif caché |  |
| 11 | Compromis de package ou de point de terminaison | Épingler la provenance immuable et le chemin de désactivation de l'exercice | Une intégration compromise peut être isolée |  |
| 12 | Délai d'expiration en amont | Délai, nouvelle tentative limitée et mappage clair des erreurs | Pas de suspension infinie ni d'effet de duplication |  |

## 8. Sources et chiffres

Pour chaque affirmation factuelle ou figure réutilisée, titre de l'enregistrement, éditeur, URL directe, révision exacte si possible, date access/observation, niveau de preuve, base de réutilisation et affirmation limitée qu'elle prend en charge.

## 9. Évaluation et limites

Signalez séparément la connexion, la découverte, la sélection, la validité des arguments, l’exécution, l’autorisation, le refus de l’utilisateur, l’annulation et les résultats des tâches de bout en bout. Indiquez l’échantillon, l’environnement, les preuves manquantes et les limites connues.

## 10. Exercice de désactivation et de récupération

- désactiver un serveur ou un outil ;
- révoquer ses pouvoirs ;
- identifier ses actions récentes à partir des journaux expurgés ;
- restaurer une bonne configuration connue ;
- vérifiez que l'ancien serveur ne peut pas agir ;
- enregistrer le temps, le propriétaire, les échecs et les travaux de suivi.

## Approbation du réviseur (facultatif)

- Critique:
- Date de révision :
- Preuve inspectée :
- Chemin sécurisé reproduit :
- Échecs attendus reproduits :
- Corrections requises :
- Décision et portée :
