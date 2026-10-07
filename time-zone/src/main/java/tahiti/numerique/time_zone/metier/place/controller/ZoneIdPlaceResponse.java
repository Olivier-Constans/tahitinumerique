package tahiti.numerique.time_zone.metier.place.controller;

import lombok.Getter;
import lombok.Setter;
import tahiti.numerique.time_zone.persistence.place.zone_id.ZoneIdPlace;

@Getter
@Setter
public class ZoneIdPlaceResponse extends PlaceResponse {

    private String zoneId;

    @Override
    public String getType() {
        return ZoneIdPlace.TYPE;
    }
}
