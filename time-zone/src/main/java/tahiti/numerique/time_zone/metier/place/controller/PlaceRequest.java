package tahiti.numerique.time_zone.metier.place.controller;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import tahiti.numerique.time_zone.persistence.place.time_zone_fixed.ZoneOffsetFixedPlace;
import tahiti.numerique.time_zone.persistence.place.zone_id.ZoneIdPlace;

/**
 * Formulaire d'un lieu : Jackson instancie la sous-classe désignée par le champ {@code type}.
 * Un type absent ou inconnu est rejeté par {@code RestExceptionHandler} avant d'atteindre le service.
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = PlaceRequest.TYPE_PROPERTY)
@JsonSubTypes({
        @JsonSubTypes.Type(value = ZoneOffsetFixedPlaceRequest.class, name = ZoneOffsetFixedPlace.TYPE),
        @JsonSubTypes.Type(value = ZoneIdPlaceRequest.class, name = ZoneIdPlace.TYPE),
})
@Getter
@Setter
@FieldNameConstants
public abstract sealed class PlaceRequest permits ZoneOffsetFixedPlaceRequest, ZoneIdPlaceRequest {

    public static final String TYPE_PROPERTY = "type";

    private String label;

    /**
     * @return le type de lieu, identique au discriminant de l'entité correspondante
     */
    public abstract String getType();
}
