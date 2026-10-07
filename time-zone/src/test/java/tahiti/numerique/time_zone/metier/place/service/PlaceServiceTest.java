package tahiti.numerique.time_zone.metier.place.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import tahiti.numerique.time_zone.core.exception.BusinessException;
import tahiti.numerique.time_zone.core.exception.NotFoundException;
import tahiti.numerique.time_zone.metier.place.controller.CalculateDateRequest;
import tahiti.numerique.time_zone.metier.place.controller.PlaceRequest;
import tahiti.numerique.time_zone.metier.place.controller.ZoneIdPlaceRequest;
import tahiti.numerique.time_zone.metier.place.controller.ZoneOffsetFixedPlaceRequest;
import tahiti.numerique.time_zone.metier.place.mapper.PlaceMapper;
import tahiti.numerique.time_zone.metier.place.service.handler.PlaceHandlerRegistry;
import tahiti.numerique.time_zone.metier.place.service.handler.ZoneIdPlaceHandler;
import tahiti.numerique.time_zone.metier.place.service.handler.ZoneOffsetFixedPlaceHandler;
import tahiti.numerique.time_zone.persistence.place.Place;
import tahiti.numerique.time_zone.persistence.place.PlaceRepository;
import tahiti.numerique.time_zone.persistence.place.time_zone_fixed.ZoneOffsetFixedPlace;
import tahiti.numerique.time_zone.persistence.place.zone_id.ZoneIdPlace;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class PlaceServiceTest {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @Mock
    private PlaceRepository placeRepository;

    @Mock
    private PlaceMapper placeMapper;

    private PlaceService placeService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        var registry = new PlaceHandlerRegistry(
                List.of(new ZoneOffsetFixedPlaceHandler(placeMapper), new ZoneIdPlaceHandler(placeMapper)));
        registry.afterSingletonsInstantiated();
        placeService = new PlaceService(placeRepository, registry);
    }

    @Test
    void testFindAll() {
        Pageable pageable = mock(Pageable.class);
        Page<Place> page = mock(Page.class);

        when(placeRepository.findAll(pageable)).thenReturn(page);
        assertEquals(page, placeService.findAll(pageable));
    }

    @Test
    void testFindByIdExisting() {
        var place = zoneOffsetFixedPlace(1L, "Z");

        when(placeRepository.findById(1L)).thenReturn(Optional.of(place));
        assertEquals(place, placeService.findById(1L));
    }

    @Test
    void testFindByIdNonExisting() {
        when(placeRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> placeService.findById(1L));
    }

    @Test
    void testFindAllZoneIdsSorted() {
        var zoneIds = placeService.findAllZoneIds();

        assertTrue(zoneIds.contains("Pacific/Tahiti"));
        assertEquals(zoneIds.stream().sorted().toList(), zoneIds);
    }

    @Test
    void testCreateZoneOffsetFixed() {
        var form = zoneOffsetFixedForm("Marquises", "-09:30");
        when(placeRepository.save(any(Place.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var place = assertInstanceOf(ZoneOffsetFixedPlace.class, placeService.create(form));

        verify(placeMapper).populate(place, form);
    }

    @Test
    void testCreateZoneId() {
        var form = zoneIdForm("Paris", "Europe/Paris");
        when(placeRepository.save(any(Place.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var place = assertInstanceOf(ZoneIdPlace.class, placeService.create(form));

        verify(placeMapper).populate(place, form);
    }

    @Test
    void testUpdateSameType() {
        var place = zoneOffsetFixedPlace(1L, "Z");
        var form = zoneOffsetFixedForm("label", "+03:00");

        when(placeRepository.findById(1L)).thenReturn(Optional.of(place));
        when(placeRepository.save(place)).thenReturn(place);

        assertEquals(place, placeService.update(1L, form));
        verify(placeMapper).populate(place, form);
        verify(placeRepository, never()).changeType(any(), any());
    }

    @Test
    void testUpdateChangesType() {
        var form = zoneIdForm("Tahiti", "Pacific/Tahiti");
        var reloaded = new ZoneIdPlace();
        reloaded.setId(1L);

        when(placeRepository.findById(1L))
                .thenReturn(Optional.of(zoneOffsetFixedPlace(1L, "-10:00")))
                .thenReturn(Optional.of(reloaded));
        when(placeRepository.save(reloaded)).thenReturn(reloaded);

        assertEquals(reloaded, placeService.update(1L, form));
        verify(placeRepository).changeType(1L, ZoneIdPlace.TYPE);
        verify(placeMapper).populate(reloaded, form);
    }

    @Test
    void testUpdateChangesTypeInvalidFormKeepsType() {
        var form = zoneIdForm("Tahiti", "Mars/Olympus");

        when(placeRepository.findById(1L)).thenReturn(Optional.of(zoneOffsetFixedPlace(1L, "-10:00")));

        assertThrows(BusinessException.class, () -> placeService.update(1L, form));
        verify(placeRepository, never()).changeType(any(), any());
    }

    @Test
    void testUpdateNotFoundException() {
        when(placeRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> placeService.update(1L, zoneOffsetFixedForm("label", "Z")));
    }

    @Test
    void testSaveLabelMissing() {
        assertSaveRejected(zoneOffsetFixedForm(null, "Z"));
    }

    @Test
    void testSaveLabelBlank() {
        assertSaveRejected(zoneOffsetFixedForm("   ", "Z"));
    }

    @Test
    void testSaveLabelTooLong() {
        assertSaveRejected(zoneOffsetFixedForm("a".repeat(Place.LABEL_MAX_LENGTH + 1), "Z"));
    }

    @Test
    void testSaveOffsetMissing() {
        assertSaveRejected(zoneOffsetFixedForm("Label", null));
    }

    @Test
    void testSaveOffsetInvalid() {
        assertSaveRejected(zoneOffsetFixedForm("Label", "+99:00"));
        assertSaveRejected(zoneOffsetFixedForm("Label", "UTC-10"));
        assertSaveRejected(zoneOffsetFixedForm("Label", "abc"));
    }

    @Test
    void testSaveOffsetNotInUse() {
        // Décalage valide pour Java mais utilisé par aucune zone
        assertSaveRejected(zoneOffsetFixedForm("Label", "+07:13"));
    }

    @Test
    void testSaveOffsetUtcVariants() {
        when(placeRepository.save(any(Place.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertDoesNotThrow(() -> placeService.create(zoneOffsetFixedForm("UTC", "Z")));
        assertDoesNotThrow(() -> placeService.create(zoneOffsetFixedForm("UTC", "+00:00")));
    }

    @Test
    void testFindAllZoneOffsetsSorted() {
        var zoneOffsets = placeService.findAllZoneOffsets();

        assertEquals(ZoneOffset.of("-12:00"), zoneOffsets.getFirst());
        assertEquals(ZoneOffset.of("+14:00"), zoneOffsets.getLast());
        assertTrue(zoneOffsets.containsAll(List.of(ZoneOffset.UTC, ZoneOffset.of("-09:30"), ZoneOffset.of("+05:45"))));
        assertEquals(zoneOffsets.stream().sorted(Comparator.comparingInt(ZoneOffset::getTotalSeconds)).toList(), zoneOffsets);
    }

    @Test
    void testSaveZoneIdMissing() {
        assertSaveRejected(zoneIdForm("Label", null));
    }

    @Test
    void testSaveZoneIdInvalid() {
        assertSaveRejected(zoneIdForm("Label", "Mars/Olympus"));
    }

    @Test
    void testSaveZoneIdOffsetRejected() {
        // Un décalage fixe se saisit avec le type ZONE_OFFSET_FIXED
        assertSaveRejected(zoneIdForm("Label", "+05:00"));
    }

    @Test
    void testDeleteById() {
        var place = zoneOffsetFixedPlace(1L, "Z");

        when(placeRepository.findById(1L)).thenReturn(Optional.of(place));

        placeService.deleteById(1L);

        verify(placeRepository, times(1)).delete(place);
    }

    @Test
    void testCalculateDate() {
        var result = calculateDate("2024-09-07 11:43", fixed("Z"), fixed("+03:00"), fixed("-05:00"));

        assertEquals(2, result.size());
        assertEquals("2024-09-07 14:43", result.get("+03:00"));
        assertEquals("2024-09-07 06:43", result.get("-05:00"));
    }

    @Test
    void testCalculateDateDayChange() {
        var result = calculateDate("2024-12-31 22:30", fixed("-10:00"), fixed("+14:00"), fixed("-12:00"));

        assertEquals("2025-01-01 22:30", result.get("+14:00"));
        assertEquals("2024-12-31 20:30", result.get("-12:00"));
    }

    @Test
    void testCalculateDateNonHourlyOffsets() {
        // Tahiti (UTC-10) vers Marquises (UTC-09:30), Népal (UTC+05:45) et Chatham (UTC+12:45)
        var result = calculateDate("2024-09-07 12:00",
                fixed("-10:00"), fixed("-09:30"), fixed("+05:45"), fixed("+12:45"));

        assertEquals("2024-09-07 12:30", result.get("-09:30"));
        assertEquals("2024-09-08 03:45", result.get("+05:45"));
        assertEquals("2024-09-08 10:45", result.get("+12:45"));
    }

    @Test
    void testCalculateDateZoneIdFollowsDaylightSaving() {
        // Paris est en UTC+02 l'été et en UTC+01 l'hiver
        assertEquals("2024-07-02 00:00",
                calculateDate("2024-07-01 12:00", fixed("-10:00"), zone("Europe/Paris")).get("Europe/Paris"));
        assertEquals("2024-01-15 23:00",
                calculateDate("2024-01-15 12:00", fixed("-10:00"), zone("Europe/Paris")).get("Europe/Paris"));
    }

    @Test
    void testCalculateDateFromZoneId() {
        // Midi à Paris en été (UTC+02) correspond à minuit à Tahiti (UTC-10)
        var result = calculateDate("2024-07-01 12:00", zone("Europe/Paris"), zone("Pacific/Tahiti"), fixed("Z"));

        assertEquals("2024-07-01 00:00", result.get("Pacific/Tahiti"));
        assertEquals("2024-07-01 10:00", result.get("Z"));
    }

    @Test
    void testCalculateDatePlaceIdMissing() {
        CalculateDateRequest form = new CalculateDateRequest();
        form.setDate(LocalDateTime.parse("2024-09-07 11:43", FORMATTER));

        assertThrows(BusinessException.class, () -> placeService.calculateDate(form));
    }

    @Test
    void testCalculateDatePlaceNotExist() {
        CalculateDateRequest form = new CalculateDateRequest();
        form.setDate(LocalDateTime.parse("2024-09-07 11:43", FORMATTER));
        form.setPlaceId(1L);

        when(placeRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(BusinessException.class, () -> placeService.calculateDate(form));
    }

    @Test
    void testCalculateDateMissing() {
        CalculateDateRequest form = new CalculateDateRequest();
        form.setPlaceId(1L);

        assertThrows(BusinessException.class, () -> placeService.calculateDate(form));
    }

    private void assertSaveRejected(PlaceRequest form) {
        assertThrows(BusinessException.class, () -> placeService.create(form));
        verify(placeRepository, never()).save(any(Place.class));
    }

    /**
     * Calcule la date saisie dans le lieu {@code source} pour chacun des lieux {@code others}.
     * @return la date formatée ("yyyy-MM-dd HH:mm") par libellé de lieu
     */
    private Map<String, String> calculateDate(String inputDate, Place source, Place... others) {
        var sourceId = 1L;
        source.setId(sourceId);
        var otherPlaces = new ArrayList<Place>();
        for (int i = 0; i < others.length; i++) {
            others[i].setId(sourceId + i + 1);
            otherPlaces.add(others[i]);
        }

        CalculateDateRequest form = new CalculateDateRequest();
        form.setDate(LocalDateTime.parse(inputDate, FORMATTER));
        form.setPlaceId(sourceId);

        when(placeRepository.findById(sourceId)).thenReturn(Optional.of(source));
        when(placeRepository.findAllByIdNot(sourceId)).thenReturn(List.copyOf(otherPlaces));

        return placeService.calculateDate(form).getCalculateDateItemList().stream()
                .collect(Collectors.toMap(
                        item -> item.getPlace().getLabel(),
                        item -> FORMATTER.format(item.getDate())));
    }

    private static ZoneOffsetFixedPlace fixed(String zoneOffset) {
        var place = new ZoneOffsetFixedPlace();
        place.setLabel(zoneOffset);
        place.setZoneOffset(ZoneOffset.of(zoneOffset));
        return place;
    }

    private static ZoneIdPlace zone(String zoneId) {
        var place = new ZoneIdPlace();
        place.setLabel(zoneId);
        place.setZoneId(ZoneId.of(zoneId));
        return place;
    }

    private static ZoneOffsetFixedPlace zoneOffsetFixedPlace(Long id, String zoneOffset) {
        var place = fixed(zoneOffset);
        place.setId(id);
        return place;
    }

    private static ZoneOffsetFixedPlaceRequest zoneOffsetFixedForm(String label, String zoneOffset) {
        var form = new ZoneOffsetFixedPlaceRequest();
        form.setLabel(label);
        form.setZoneOffset(zoneOffset);
        return form;
    }

    private static ZoneIdPlaceRequest zoneIdForm(String label, String zoneId) {
        var form = new ZoneIdPlaceRequest();
        form.setLabel(label);
        form.setZoneId(zoneId);
        return form;
    }
}
