package tahiti.numerique.time_zone.metier.timezone.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import tahiti.numerique.time_zone.metier.audit.mapper.AuditMapper;
import tahiti.numerique.time_zone.metier.timezone.controller.TimezoneRequest;
import tahiti.numerique.time_zone.metier.timezone.controller.TimezoneResponse;
import tahiti.numerique.time_zone.persistence.OffsetUTC;
import tahiti.numerique.time_zone.persistence.timezone.Timezone;

@Mapper(componentModel = "spring", uses = AuditMapper.class)
public interface TimezoneMapper {

    TimezoneResponse mapToResponse(Timezone timezone);

    /**
     * L'offset n'est pas mappé ici : il est validé puis renseigné par le service.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "audit", ignore = true)
    @Mapping(target = "offsetUTC", ignore = true)
    void populate(@MappingTarget Timezone timezone, TimezoneRequest form);

    default String mapOffsetUTC(OffsetUTC offsetUTC) {
        return offsetUTC == null ? null : offsetUTC.getLabel();
    }

}
