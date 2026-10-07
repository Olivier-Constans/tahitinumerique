package tahiti.numerique.time_zone.metier.place.controller;

import lombok.Getter;
import lombok.Setter;
import tahiti.numerique.time_zone.persistence.place.time_zone_fixed.ZoneOffsetFixedPlace;

@Getter
@Setter
public class ZoneOffsetFixedPlaceResponse extends PlaceResponse {

    private String zoneOffset;

    @Override
    public String getType() {
        return ZoneOffsetFixedPlace.TYPE;
    }
}
