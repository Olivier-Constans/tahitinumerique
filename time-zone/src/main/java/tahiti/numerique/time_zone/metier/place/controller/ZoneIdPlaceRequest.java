package tahiti.numerique.time_zone.metier.place.controller;

import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import tahiti.numerique.time_zone.persistence.place.zone_id.ZoneIdPlace;

@Getter
@Setter
@FieldNameConstants
public final class ZoneIdPlaceRequest extends PlaceRequest {

    private String zoneId;

    @Override
    public String getType() {
        return ZoneIdPlace.TYPE;
    }
}
