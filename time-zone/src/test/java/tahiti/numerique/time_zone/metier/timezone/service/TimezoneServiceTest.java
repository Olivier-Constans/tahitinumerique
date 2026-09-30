package tahiti.numerique.time_zone.metier.timezone.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import tahiti.numerique.time_zone.core.exception.BusinessException;
import tahiti.numerique.time_zone.core.exception.NotFoundException;
import tahiti.numerique.time_zone.metier.timezone.controller.CalculateDateRequest;
import tahiti.numerique.time_zone.metier.timezone.controller.TimezoneRequest;
import tahiti.numerique.time_zone.metier.timezone.mapper.TimezoneMapper;
import tahiti.numerique.time_zone.persistence.OffsetUTC;
import tahiti.numerique.time_zone.persistence.timezone.Timezone;
import tahiti.numerique.time_zone.persistence.timezone.TimezoneRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class TimezoneServiceTest {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @Mock
    private TimezoneRepository timezoneRepository;

    @Mock
    private TimezoneMapper timezoneMapper;

    @InjectMocks
    private TimezoneService timezoneService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testFindAll() {
        Pageable pageable = mock(Pageable.class);
        Page<Timezone> page = mock(Page.class);

        when(timezoneRepository.findAll(pageable)).thenReturn(page);
        assertEquals(page, timezoneService.findAll(pageable));
    }

    @Test
    void testFindByIdExisting() {
        var id = 1L;
        Timezone timezone = new Timezone();
        timezone.setId(id);

        when(timezoneRepository.findById(id)).thenReturn(Optional.of(timezone));
        assertEquals(timezone, timezoneService.findById(id));
    }

    @Test
    void testFindByIdNonExisting() {
        var id = 1L;

        when(timezoneRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> timezoneService.findById(id));
    }

    @Test
    void testCreate() {
        TimezoneRequest form = new TimezoneRequest();
        form.setLabel("label");
        form.setOffsetUTC(OffsetUTC.UTC.getLabel());

        Timezone timezone = new Timezone();

        doNothing().when(timezoneMapper).populate(any(Timezone.class), eq(form));
        when(timezoneRepository.save(any(Timezone.class))).thenReturn(timezone);

        assertEquals(timezone, timezoneService.create(form));
    }

    @Test
    void testUpdate() {
        var id = 1L;
        TimezoneRequest form = new TimezoneRequest();
        form.setLabel("label");
        form.setOffsetUTC(OffsetUTC.UTC.getLabel());
        Timezone timezone = new Timezone();
        timezone.setId(id);

        when(timezoneRepository.findById(id)).thenReturn(Optional.of(timezone));
        doNothing().when(timezoneMapper).populate(timezone, form);
        when(timezoneRepository.save(timezone)).thenReturn(timezone);

        assertEquals(timezone, timezoneService.update(1L, form));
    }

    @Test
    void testUpdateNotFoundException() {
        var id = 1L;
        TimezoneRequest form = new TimezoneRequest();
        form.setLabel("label");
        form.setOffsetUTC(OffsetUTC.UTC.getLabel());
        Timezone timezone = new Timezone();
        timezone.setId(id);

        when(timezoneRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> timezoneService.update(1L, form));
    }

    @Test
    void testSaveLabelMissing() {
        var id = 1L;
        TimezoneRequest form = new TimezoneRequest();
        form.setOffsetUTC(OffsetUTC.UTC.getLabel());

        when(timezoneRepository.findById(id)).thenReturn(Optional.of(new Timezone()));
        assertThrows(BusinessException.class, () -> timezoneService.update(1L, form));
    }

    @Test
    void testSaveOffsetMissing() {
        var id = 1L;
        TimezoneRequest form = new TimezoneRequest();
        form.setLabel("Label");

        when(timezoneRepository.findById(id)).thenReturn(Optional.of(new Timezone()));
        assertThrows(BusinessException.class, () -> timezoneService.update(1L, form));
    }

    @Test
    void testSaveOffsetInvalid() {
        TimezoneRequest form = new TimezoneRequest();
        form.setLabel("Label");
        form.setOffsetUTC("UTC+99");

        assertThrows(BusinessException.class, () -> timezoneService.create(form));
        verify(timezoneRepository, never()).save(any(Timezone.class));
    }

    @Test
    void testDeleteById() {
        var id = 1L;
        Timezone timezone = new Timezone();
        timezone.setId(id);

        when(timezoneRepository.findById(id)).thenReturn(Optional.of(timezone));
        doNothing().when(timezoneRepository).delete(timezone);

        timezoneService.deleteById(id);

        verify(timezoneRepository, times(1)).delete(timezone);
    }


    @Test
    void testSaveLabelBlank() {
        TimezoneRequest form = new TimezoneRequest();
        form.setLabel("   ");
        form.setOffsetUTC(OffsetUTC.UTC.getLabel());

        assertThrows(BusinessException.class, () -> timezoneService.create(form));
        verify(timezoneRepository, never()).save(any(Timezone.class));
    }

    @Test
    void testSaveLabelTooLong() {
        TimezoneRequest form = new TimezoneRequest();
        form.setLabel("a".repeat(Timezone.LABEL_MAX_LENGTH + 1));
        form.setOffsetUTC(OffsetUTC.UTC.getLabel());

        assertThrows(BusinessException.class, () -> timezoneService.create(form));
        verify(timezoneRepository, never()).save(any(Timezone.class));
    }

    @Test
    void testSaveSetsOffset() {
        TimezoneRequest form = new TimezoneRequest();
        form.setLabel("Marquises");
        form.setOffsetUTC("utc-09:30");

        when(timezoneRepository.save(any(Timezone.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertEquals(OffsetUTC.UTC_MINUS_09_30, timezoneService.create(form).getOffsetUTC());
    }

    @Test
    void testCalculateDate() {
        var result = calculateDate("2024-09-07 11:43", OffsetUTC.UTC, OffsetUTC.UTC_PLUS_03, OffsetUTC.UTC_MINUS_05);

        assertEquals(2, result.size());
        assertEquals("2024-09-07 14:43", result.get(OffsetUTC.UTC_PLUS_03));
        assertEquals("2024-09-07 06:43", result.get(OffsetUTC.UTC_MINUS_05));
    }

    @Test
    void testCalculateDateDayChange() {
        var result = calculateDate("2024-12-31 22:30", OffsetUTC.UTC_MINUS_10, OffsetUTC.UTC_PLUS_14, OffsetUTC.UTC_MINUS_12);

        assertEquals("2025-01-01 22:30", result.get(OffsetUTC.UTC_PLUS_14));
        assertEquals("2024-12-31 20:30", result.get(OffsetUTC.UTC_MINUS_12));
    }

    @Test
    void testCalculateDateNonHourlyOffsets() {
        // Tahiti (UTC-10) vers Marquises (UTC-09:30), Népal (UTC+05:45) et Chatham (UTC+12:45)
        var result = calculateDate("2024-09-07 12:00",
                OffsetUTC.UTC_MINUS_10, OffsetUTC.UTC_MINUS_09_30, OffsetUTC.UTC_PLUS_05_45, OffsetUTC.UTC_PLUS_12_45);

        assertEquals("2024-09-07 12:30", result.get(OffsetUTC.UTC_MINUS_09_30));
        assertEquals("2024-09-08 03:45", result.get(OffsetUTC.UTC_PLUS_05_45));
        assertEquals("2024-09-08 10:45", result.get(OffsetUTC.UTC_PLUS_12_45));
    }

    @Test
    void testCalculateDateTimezoneIdMissing() {
        CalculateDateRequest form = new CalculateDateRequest();
        form.setDate(LocalDateTime.parse("2024-09-07 11:43", FORMATTER));

        assertThrows(BusinessException.class, () -> timezoneService.calculateDate(form));
    }

    @Test
    void testCalculateDateTimezoneNotExist() {
        CalculateDateRequest form = new CalculateDateRequest();
        form.setDate(LocalDateTime.parse("2024-09-07 11:43", FORMATTER));
        form.setTimezoneId(1L);

        when(timezoneRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(BusinessException.class, () -> timezoneService.calculateDate(form));
    }

    @Test
    void testCalculateDateMissing() {
        CalculateDateRequest form = new CalculateDateRequest();
        form.setTimezoneId(1L);

        assertThrows(BusinessException.class, () -> timezoneService.calculateDate(form));
    }

    /**
     * Calcule la date saisie dans le fuseau {@code source} pour chacun des fuseaux {@code others}.
     * @return la date formatée ("yyyy-MM-dd HH:mm") par offset
     */
    private Map<OffsetUTC, String> calculateDate(String inputDate, OffsetUTC source, OffsetUTC... others) {
        var sourceId = 1L;
        Timezone sourceTimezone = timezone(sourceId, source);
        var otherTimezones = new ArrayList<Timezone>();
        for (int i = 0; i < others.length; i++) {
            otherTimezones.add(timezone(sourceId + i + 1, others[i]));
        }

        CalculateDateRequest form = new CalculateDateRequest();
        form.setDate(LocalDateTime.parse(inputDate, FORMATTER));
        form.setTimezoneId(sourceId);

        when(timezoneRepository.findById(sourceId)).thenReturn(Optional.of(sourceTimezone));
        when(timezoneRepository.findAllByIdNot(sourceId)).thenReturn(otherTimezones);

        return timezoneService.calculateDate(form).getCalculateDateItemList().stream()
                .collect(Collectors.toMap(
                        item -> item.getTimezone().getOffsetUTC(),
                        item -> FORMATTER.format(item.getDate())));
    }

    private static Timezone timezone(Long id, OffsetUTC offsetUTC) {
        Timezone timezone = new Timezone();
        timezone.setId(id);
        timezone.setOffsetUTC(offsetUTC);
        return timezone;
    }
}
