package tahiti.numerique.time_zone.metier.place.controller;

import lombok.Getter;
import lombok.Setter;
import tahiti.numerique.time_zone.metier.audit.controller.AuditResponse;

@Getter
@Setter
public abstract class PlaceResponse {

    private Long id;

    private AuditResponse audit;

    private String label;

    /**
     * Discriminant du type de lieu. Propriété ordinaire plutôt que {@code @JsonTypeInfo}, que Jackson
     * n'applique pas aux éléments d'une liste générique comme {@code PageResponse<T>}.
     */
    public abstract String getType();
}
