package tahiti.numerique.time_zone.metier.timezone.mapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import tahiti.numerique.time_zone.metier.audit.mapper.AuditMapperImpl;
import tahiti.numerique.time_zone.metier.timezone.controller.TimezoneRequest;
import tahiti.numerique.time_zone.persistence.OffsetUTC;
import tahiti.numerique.time_zone.persistence.audit.Audit;
import tahiti.numerique.time_zone.persistence.timezone.Timezone;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class TimezoneMapperTest {

    private TimezoneMapperImpl mapper;

    @BeforeEach
    void setUp() {
        mapper = new TimezoneMapperImpl();
        ReflectionTestUtils.setField(mapper, "auditMapper", new AuditMapperImpl());
    }

    @Test
    void testMapToResponse() {
        var audit = new Audit();
        audit.setCreateDate(Instant.parse("2024-09-07T10:00:00Z"));
        audit.setUpdateDate(Instant.parse("2024-09-08T10:00:00Z"));

        var timezone = new Timezone();
        timezone.setId(1L);
        timezone.setLabel("Tahiti");
        timezone.setOffsetUTC(OffsetUTC.UTC_MINUS_10);
        timezone.setAudit(audit);

        var response = mapper.mapToResponse(timezone);

        assertEquals(1L, response.getId());
        assertEquals("Tahiti", response.getLabel());
        assertEquals("UTC-10", response.getOffsetUTC());
        assertEquals(audit.getCreateDate(), response.getAudit().getCreateDate());
        assertEquals(audit.getUpdateDate(), response.getAudit().getUpdateDate());
    }

    @Test
    void testMapToResponseWithoutOffset() {
        var timezone = new Timezone();
        timezone.setLabel("Sans offset");

        assertNull(mapper.mapToResponse(timezone).getOffsetUTC());
    }

    @Test
    void testPopulateKeepsIdAuditAndOffset() {
        var audit = new Audit();
        var timezone = new Timezone();
        timezone.setId(1L);
        timezone.setAudit(audit);
        timezone.setOffsetUTC(OffsetUTC.UTC);

        var form = new TimezoneRequest();
        form.setLabel("Nouveau label");
        form.setOffsetUTC("UTC+03");

        mapper.populate(timezone, form);

        assertEquals("Nouveau label", timezone.getLabel());
        assertEquals(1L, timezone.getId());
        assertSame(audit, timezone.getAudit());
        // l'offset est renseigné par le service après validation
        assertEquals(OffsetUTC.UTC, timezone.getOffsetUTC());
    }
}
