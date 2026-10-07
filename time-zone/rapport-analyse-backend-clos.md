# Points clos du rapport d'analyse back-end

> Points corrigés ou ignorés, triés par date de clôture (la plus récente en premier). Les points ouverts sont dans `rapport-analyse-backend.md`.

#### BACK-20261007-07 · Info · Liste des décalages UTC dupliquée dans le front
- **Statut** : Corrigé le 2026-10-07
- **Découvert le** : 2026-10-07 · **Dernière vérification** : 2026-10-07
- **Emplacement** : `src/main/java/tahiti/numerique/time_zone/persistence/OffsetUTC.java:11`
- **Constat** : aucune route n'expose les valeurs de `OffsetUTC` ; le front en recopie les 41 libellés (`time-zone-frontend/src/app/shared/model/offsetUTC.model.ts:4`). Les deux listes sont identiques aujourd'hui.
- **Impact** : ajouter un décalage côté back sans mettre à jour le front fait échouer la validation Zod des réponses (« Réponse inattendue du serveur ») pour tout fuseau utilisant ce décalage.
- **Recommandation** : exposer `GET /timezones/offsets` renvoyant la liste ordonnée des libellés et la consommer dans le formulaire, ou au minimum ajouter un test (back ou front) qui compare les deux listes.
- **Correction** : résolu par une évolution, sans correction dédiée : l'enum `OffsetUTC` et `offsetUTC.model.ts` sont supprimés (commit 0767ab0). Les décalages sont des `ZoneOffset`, la liste acceptée est exposée par `GET /places/zone-offsets` (`PlaceController.java:71`) et consommée par le formulaire du front ; le schéma Zod ne contrôle plus que le format ISO-8601.
