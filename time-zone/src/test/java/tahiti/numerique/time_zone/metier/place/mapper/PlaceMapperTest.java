package tahiti.numerique.time_zone.metier.place.mapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import tahiti.numerique.time_zone.metier.audit.mapper.AuditMapperImpl;
import tahiti.numerique.time_zone.metier.place.controller.ZoneIdPlaceRequest;
import tahiti.numerique.time_zone.metier.place.controller.ZoneOffsetFixedPlaceRequest;
import tahiti.numerique.time_zone.metier.place.controller.ZoneIdPlaceResponse;
import tahiti.numerique.time_zone.metier.place.controller.ZoneOffsetFixedPlaceResponse;
import tahiti.numerique.time_zone.persistence.audit.Audit;
import tahiti.numerique.time_zone.persistence.place.time_zone_fixed.ZoneOffsetFixedPlace;
import tahiti.numerique.time_zone.persistence.place.zone_id.ZoneIdPlace;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.*;

class PlaceMapperTest {

    private PlaceMapperImpl mapper;

    @BeforeEach
    void setUp() {
        mapper = new PlaceMapperImpl();
        ReflectionTestUtils.setField(mapper, "auditMapper", new AuditMapperImpl());
    }

    @Test
    void testMapZoneOffsetFixedToResponse() {
        var audit = new Audit();
        audit.setCreateDate(Instant.parse("2024-09-07T10:00:00Z"));
        audit.setUpdateDate(Instant.parse("2024-09-08T10:00:00Z"));

        var place = new ZoneOffsetFixedPlace();
        place.setId(1L);
        place.setLabel("Tahiti");
        place.setZoneOffset(ZoneOffset.of("-10:00"));
        place.setAudit(audit);

        var response = assertInstanceOf(ZoneOffsetFixedPlaceResponse.class, mapper.mapToResponse(place));

        assertEquals(1L, response.getId());
        assertEquals("Tahiti", response.getLabel());
        assertEquals("-10:00", response.getZoneOffset());
        assertEquals(audit.getCreateDate(), response.getAudit().getCreateDate());
        assertEquals(audit.getUpdateDate(), response.getAudit().getUpdateDate());
    }

    @Test
    void testMapZoneOffsetFixedToResponseWithoutOffset() {
        var place = new ZoneOffsetFixedPlace();
        place.setLabel("Sans offset");

        var response = assertInstanceOf(ZoneOffsetFixedPlaceResponse.class, mapper.mapToResponse(place));
        assertNull(response.getZoneOffset());
    }

    @Test
    void testMapUtcToResponse() {
        var place = new ZoneOffsetFixedPlace();
        place.setZoneOffset(ZoneOffset.UTC);

        var response = assertInstanceOf(ZoneOffsetFixedPlaceResponse.class, mapper.mapToResponse(place));
        assertEquals("Z", response.getZoneOffset());
    }

    @Test
    void testMapZoneIdToResponse() {
        var place = new ZoneIdPlace();
        place.setId(2L);
        place.setLabel("Paris");
        place.setZoneId(ZoneId.of("Europe/Paris"));

        var response = assertInstanceOf(ZoneIdPlaceResponse.class, mapper.mapToResponse(place));

        assertEquals(2L, response.getId());
        assertEquals("Paris", response.getLabel());
        assertEquals("Europe/Paris", response.getZoneId());
    }

    @Test
    void testPopulateZoneOffsetFixedKeepsIdAndAudit() {
        var audit = new Audit();
        var place = new ZoneOffsetFixedPlace();
        place.setId(1L);
        place.setAudit(audit);
        place.setZoneOffset(ZoneOffset.UTC);

        var form = new ZoneOffsetFixedPlaceRequest();
        form.setLabel("Nouveau label");
        form.setZoneOffset("+03:00");

        mapper.populate(place, form);

        assertEquals("Nouveau label", place.getLabel());
        assertEquals(ZoneOffset.ofHours(3), place.getZoneOffset());
        assertEquals(1L, place.getId());
        assertSame(audit, place.getAudit());
    }

    @Test
    void testPopulateZoneIdKeepsIdAndAudit() {
        var audit = new Audit();
        var place = new ZoneIdPlace();
        place.setId(2L);
        place.setAudit(audit);

        var form = new ZoneIdPlaceRequest();
        form.setLabel("Papeete");
        form.setZoneId("Pacific/Tahiti");

        mapper.populate(place, form);

        assertEquals("Papeete", place.getLabel());
        assertEquals(ZoneId.of("Pacific/Tahiti"), place.getZoneId());
        assertEquals(2L, place.getId());
        assertSame(audit, place.getAudit());
    }
}
