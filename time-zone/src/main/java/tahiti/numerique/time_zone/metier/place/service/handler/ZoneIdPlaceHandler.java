package tahiti.numerique.time_zone.metier.place.service.handler;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tahiti.numerique.time_zone.core.validator.ObjectValidator;
import tahiti.numerique.time_zone.metier.place.controller.ZoneIdPlaceRequest;
import tahiti.numerique.time_zone.metier.place.mapper.PlaceMapper;
import tahiti.numerique.time_zone.persistence.place.zone_id.ZoneIdPlace;

import java.time.ZoneId;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ZoneIdPlaceHandler implements PlaceHandler<ZoneIdPlaceRequest, ZoneIdPlace> {

    // Identifiants IANA connus de la JVM (ex : Pacific/Tahiti), triés pour l'affichage
    public static final List<String> ZONE_IDS = ZoneId.getAvailableZoneIds().stream().sorted().toList();

    private final PlaceMapper placeMapper;

    @Override
    public Class<ZoneIdPlaceRequest> requestType() {
        return ZoneIdPlaceRequest.class;
    }

    @Override
    public Class<ZoneIdPlace> placeType() {
        return ZoneIdPlace.class;
    }

    @Override
    public ZoneIdPlace newPlace() {
        return new ZoneIdPlace();
    }

    @Override
    public void validate(ZoneIdPlaceRequest form) {
        ObjectValidator.required(form.getZoneId(), ZoneIdPlaceRequest.Fields.zoneId);
        ObjectValidator.valid(ZONE_IDS.contains(form.getZoneId()), ZoneIdPlaceRequest.Fields.zoneId);
    }

    @Override
    public void populate(ZoneIdPlace place, ZoneIdPlaceRequest form) {
        placeMapper.populate(place, form);
    }
}
