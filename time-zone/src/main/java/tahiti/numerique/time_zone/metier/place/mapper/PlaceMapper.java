package tahiti.numerique.time_zone.metier.place.mapper;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.SubclassExhaustiveStrategy;
import org.mapstruct.SubclassMapping;
import tahiti.numerique.time_zone.metier.audit.mapper.AuditMapper;
import tahiti.numerique.time_zone.metier.place.controller.PlaceResponse;
import tahiti.numerique.time_zone.metier.place.controller.ZoneIdPlaceRequest;
import tahiti.numerique.time_zone.metier.place.controller.ZoneIdPlaceResponse;
import tahiti.numerique.time_zone.metier.place.controller.ZoneOffsetFixedPlaceRequest;
import tahiti.numerique.time_zone.metier.place.controller.ZoneOffsetFixedPlaceResponse;
import tahiti.numerique.time_zone.persistence.place.Place;
import tahiti.numerique.time_zone.persistence.place.time_zone_fixed.ZoneOffsetFixedPlace;
import tahiti.numerique.time_zone.persistence.place.zone_id.ZoneIdPlace;

import java.time.ZoneId;
import java.time.ZoneOffset;

@Mapper(componentModel = "spring", uses = AuditMapper.class)
public interface PlaceMapper {

    @SubclassMapping(source = ZoneOffsetFixedPlace.class, target = ZoneOffsetFixedPlaceResponse.class)
    @SubclassMapping(source = ZoneIdPlace.class, target = ZoneIdPlaceResponse.class)
    @BeanMapping(subclassExhaustiveStrategy = SubclassExhaustiveStrategy.RUNTIME_EXCEPTION)
    PlaceResponse mapToResponse(Place place);

    /**
     * Le formulaire doit avoir été validé par le service : un décalage mal formé lèverait une {@code DateTimeException}.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "audit", ignore = true)
    void populate(@MappingTarget ZoneOffsetFixedPlace place, ZoneOffsetFixedPlaceRequest form);

    /**
     * Le formulaire doit avoir été validé par le service : une zone inconnue lèverait une {@code DateTimeException}.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "audit", ignore = true)
    void populate(@MappingTarget ZoneIdPlace place, ZoneIdPlaceRequest form);

    default ZoneOffset mapZoneOffset(String zoneOffset) {
        return zoneOffset == null ? null : ZoneOffset.of(zoneOffset);
    }

    default String mapZoneId(ZoneId zoneId) {
        return zoneId == null ? null : zoneId.getId();
    }

    default ZoneId mapZoneId(String zoneId) {
        return zoneId == null ? null : ZoneId.of(zoneId);
    }

}
