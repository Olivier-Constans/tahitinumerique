package tahiti.numerique.time_zone.metier.place.controller;

import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import tahiti.numerique.time_zone.persistence.place.time_zone_fixed.ZoneOffsetFixedPlace;

@Getter
@Setter
@FieldNameConstants
public final class ZoneOffsetFixedPlaceRequest extends PlaceRequest {

    private String zoneOffset;

    @Override
    public String getType() {
        return ZoneOffsetFixedPlace.TYPE;
    }
}
