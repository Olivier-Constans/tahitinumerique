package tahiti.numerique.time_zone.metier.place.service.handler;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tahiti.numerique.time_zone.core.validator.ObjectValidator;
import tahiti.numerique.time_zone.metier.place.controller.ZoneOffsetFixedPlaceRequest;
import tahiti.numerique.time_zone.metier.place.mapper.PlaceMapper;
import tahiti.numerique.time_zone.persistence.place.time_zone_fixed.ZoneOffsetFixedPlace;

import java.time.DateTimeException;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.zone.ZoneOffsetTransition;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Component
@RequiredArgsConstructor
public class ZoneOffsetFixedPlaceHandler implements PlaceHandler<ZoneOffsetFixedPlaceRequest, ZoneOffsetFixedPlace> {

    /**
     * Décalages en vigueur dans au moins une zone IANA de la JVM, au démarrage ou dans l'année qui suit
     * (heure d'été comprise), triés de {@code -12:00} à {@code +14:00}.
     */
    public static final List<ZoneOffset> ZONE_OFFSETS = realZoneOffsets(Instant.now());

    private final PlaceMapper placeMapper;

    static List<ZoneOffset> realZoneOffsets(Instant from) {
        var until = from.plus(Duration.ofDays(366));
        return ZoneId.getAvailableZoneIds().stream()
                .map(zoneId -> ZoneId.of(zoneId).getRules())
                .flatMap(rules -> Stream.concat(
                        Stream.of(rules.getOffset(from)),
                        Stream.iterate(rules.nextTransition(from),
                                        transition -> transition != null && transition.getInstant().isBefore(until),
                                        transition -> rules.nextTransition(transition.getInstant()))
                                .map(ZoneOffsetTransition::getOffsetAfter)))
                .distinct()
                .sorted(Comparator.comparingInt(ZoneOffset::getTotalSeconds))
                .toList();
    }

    @Override
    public Class<ZoneOffsetFixedPlaceRequest> requestType() {
        return ZoneOffsetFixedPlaceRequest.class;
    }

    @Override
    public Class<ZoneOffsetFixedPlace> placeType() {
        return ZoneOffsetFixedPlace.class;
    }

    @Override
    public ZoneOffsetFixedPlace newPlace() {
        return new ZoneOffsetFixedPlace();
    }

    @Override
    public void validate(ZoneOffsetFixedPlaceRequest form) {
        ObjectValidator.required(form.getZoneOffset(), ZoneOffsetFixedPlaceRequest.Fields.zoneOffset);
        ObjectValidator.valid(ZONE_OFFSETS.contains(parse(form.getZoneOffset())),
                ZoneOffsetFixedPlaceRequest.Fields.zoneOffset);
    }

    @Override
    public void populate(ZoneOffsetFixedPlace place, ZoneOffsetFixedPlaceRequest form) {
        placeMapper.populate(place, form);
    }

    private static ZoneOffset parse(String zoneOffset) {
        try {
            return ZoneOffset.of(zoneOffset);
        } catch (DateTimeException e) {
            return null;
        }
    }
}
