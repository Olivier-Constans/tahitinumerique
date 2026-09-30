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
import tahiti.numerique.time_zone.metier.timezone.controller.TimezoneResponse;
import tahiti.numerique.time_zone.metier.timezone.mapper.TimezoneMapper;
import tahiti.numerique.time_zone.persistence.OffsetUTC;
import tahiti.numerique.time_zone.persistence.timezone.Timezone;
import tahiti.numerique.time_zone.persistence.timezone.TimezoneRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class TimezoneServiceTest {

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
    void testCalculateDate() {
        String inputDateS = "2024-09-07 11:43";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        var id = 1L;
        var timezoneResponse = new TimezoneResponse();
        timezoneResponse.setId(id);
        timezoneResponse.setOffsetUTC(OffsetUTC.UTC.getLabel());

        CalculateDateRequest form = new CalculateDateRequest();
        form.setDate(LocalDateTime.parse(inputDateS, formatter));
        form.setTimezone(timezoneResponse);

        Timezone timezone = new Timezone();
        timezone.setId(id);
        timezone.setOffsetUTC(OffsetUTC.UTC);

        Timezone timezoneUTCMinus5 = new Timezone();
        timezoneUTCMinus5.setId(2L);
        timezoneUTCMinus5.setOffsetUTC(OffsetUTC.UTC_MINUS_05);

        Timezone timezoneUTCPlus3 = new Timezone();
        timezoneUTCPlus3.setId(3L);
        timezoneUTCPlus3.setOffsetUTC(OffsetUTC.UTC_PLUS_03);

        when(timezoneRepository.findById(id)).thenReturn(Optional.of(timezone));
        when(timezoneRepository.findAll()).thenReturn(List.of(timezone, timezoneUTCPlus3, timezoneUTCMinus5));

        CalculateDate result = timezoneService.calculateDate(form);

        assertNotNull(result);
        assertEquals(result.getCalculateDateItemList().size(), 2);

        var list = result.getCalculateDateItemList();

        assertEquals(formatter.format(list.get(0).getDate()), "2024-09-07 14:43");
        assertEquals(formatter.format(list.get(1).getDate()), "2024-09-07 06:43");
    }

    @Test
    void testCalculateDateTimezoneMissing() {
        String inputDateS = "2024-09-07 11:43";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        CalculateDateRequest form = new CalculateDateRequest();
        form.setDate(LocalDateTime.parse(inputDateS, formatter));

        assertThrows(BusinessException.class, () -> timezoneService.calculateDate(form));
    }

    @Test
    void testCalculateDateTimezoneIdMissing() {
        String inputDateS = "2024-09-07 11:43";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        CalculateDateRequest form = new CalculateDateRequest();
        form.setDate(LocalDateTime.parse(inputDateS, formatter));
        form.setTimezone(new TimezoneResponse());

        assertThrows(BusinessException.class, () -> timezoneService.calculateDate(form));
    }

    @Test
    void testCalculateDateMissing() {
        CalculateDateRequest form = new CalculateDateRequest();
        form.setTimezone(new TimezoneResponse());

        assertThrows(BusinessException.class, () -> timezoneService.calculateDate(form));
    }
}
