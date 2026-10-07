package tahiti.numerique.time_zone.metier.place.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tahiti.numerique.time_zone.core.exception.BusinessException;
import tahiti.numerique.time_zone.core.exception.NotFoundException;
import tahiti.numerique.time_zone.metier.audit.mapper.AuditMapperImpl;
import tahiti.numerique.time_zone.metier.place.mapper.CalculateDateMapperImpl;
import tahiti.numerique.time_zone.metier.place.mapper.PlaceMapperImpl;
import tahiti.numerique.time_zone.metier.place.service.CalculateDate;
import tahiti.numerique.time_zone.metier.place.service.PlaceService;
import tahiti.numerique.time_zone.persistence.place.time_zone_fixed.ZoneOffsetFixedPlace;
import tahiti.numerique.time_zone.persistence.place.zone_id.ZoneIdPlace;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_FORM_REQUIRED;

@WebMvcTest(PlaceController.class)
@Import({PlaceMapperImpl.class, AuditMapperImpl.class, CalculateDateMapperImpl.class})
class PlaceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PlaceService service;

    @Test
    void testGetAllPlaces() throws Exception {
        var pageable = PageRequest.of(0, 10);
        when(service.findAll(any())).thenReturn(new PageImpl<>(List.of(zoneOffsetFixedPlace(1L), zoneIdPlace(2L)), pageable, 11));

        mockMvc.perform(get("/places").param("page", "0").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].type").value("ZONE_OFFSET_FIXED"))
                .andExpect(jsonPath("$.content[0].zoneOffset").value("-10:00"))
                .andExpect(jsonPath("$.content[0].zoneId").doesNotExist())
                .andExpect(jsonPath("$.content[1].id").value(2))
                .andExpect(jsonPath("$.content[1].type").value("ZONE_ID"))
                .andExpect(jsonPath("$.content[1].zoneId").value("Europe/Paris"))
                .andExpect(jsonPath("$.content[1].zoneOffset").doesNotExist())
                .andExpect(jsonPath("$.totalElements").value(11))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.size").value(10));
    }

    @Test
    void testCreatePlace() throws Exception {
        when(service.create(any())).thenReturn(zoneOffsetFixedPlace(5L));

        mockMvc.perform(post("/places")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"ZONE_OFFSET_FIXED\",\"label\":\"Tahiti\",\"zoneOffset\":\"-10:00\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/places/5"))
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.type").value("ZONE_OFFSET_FIXED"));
    }

    @Test
    void testGetPlaceByIdNotFound() throws Exception {
        when(service.findById(1234L)).thenThrow(new NotFoundException("place", 1234L));

        mockMvc.perform(get("/places/1234"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("L'objet place d'id '1234' n'a pas été trouvé."));
    }

    @Test
    void testGetAllZoneIds() throws Exception {
        when(service.findAllZoneIds()).thenReturn(List.of("Europe/Paris", "Pacific/Tahiti"));

        mockMvc.perform(get("/places/zone-ids"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("Europe/Paris"))
                .andExpect(jsonPath("$[1]").value("Pacific/Tahiti"));
    }

    @Test
    void testGetAllZoneOffsets() throws Exception {
        when(service.findAllZoneOffsets()).thenReturn(List.of(ZoneOffset.of("-10:00"), ZoneOffset.UTC, ZoneOffset.of("+05:30")));

        mockMvc.perform(get("/places/zone-offsets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("-10:00"))
                .andExpect(jsonPath("$[1]").value("Z"))
                .andExpect(jsonPath("$[2]").value("+05:30"));
    }

    @Test
    void testCalculateDate() throws Exception {
        var result = new CalculateDate();
        result.getCalculateDateItemList().add(
                new CalculateDate.CalculateDateItem(zoneIdPlace(2L), LocalDateTime.parse("2026-10-07T00:00:00")));
        when(service.calculateDate(any())).thenReturn(result);

        mockMvc.perform(post("/places/calculate-date")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"placeId\":1,\"date\":\"2026-10-06T12:00:00\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.calculateDateItemList[0].place.type").value("ZONE_ID"))
                .andExpect(jsonPath("$.calculateDateItemList[0].place.zoneId").value("Europe/Paris"))
                .andExpect(jsonPath("$.calculateDateItemList[0].date").value("2026-10-07T00:00:00"));
    }

    @Test
    void testBusinessException() throws Exception {
        when(service.create(any())).thenThrow(new BusinessException(GENERIC_FORM_REQUIRED, new Object[]{"label"}));

        mockMvc.perform(post("/places")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"ZONE_ID\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Le champ 'label' est obligatoire."));
    }

    @Test
    void testCreatePlaceDeserializesZoneOffsetFixedRequest() throws Exception {
        when(service.create(any())).thenReturn(zoneOffsetFixedPlace(5L));

        mockMvc.perform(post("/places")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"ZONE_OFFSET_FIXED\",\"label\":\"Tahiti\",\"zoneOffset\":\"-10:00\"}"))
                .andExpect(status().isCreated());

        verify(service).create(argThat(form -> form instanceof ZoneOffsetFixedPlaceRequest request
                && "Tahiti".equals(request.getLabel()) && "-10:00".equals(request.getZoneOffset())));
    }

    @Test
    void testUpdatePlaceDeserializesZoneIdRequest() throws Exception {
        when(service.update(eq(2L), any())).thenReturn(zoneIdPlace(2L));

        mockMvc.perform(put("/places/2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"ZONE_ID\",\"label\":\"Paris\",\"zoneId\":\"Europe/Paris\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("ZONE_ID"));

        verify(service).update(eq(2L), argThat(form -> form instanceof ZoneIdPlaceRequest request
                && "Paris".equals(request.getLabel()) && "Europe/Paris".equals(request.getZoneId())));
    }

    @Test
    void testCreatePlaceWithoutType() throws Exception {
        mockMvc.perform(post("/places")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"label\":\"Tahiti\",\"zoneOffset\":\"-10:00\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Le champ 'type' est obligatoire."));

        verifyNoInteractions(service);
    }

    @Test
    void testCreatePlaceWithUnknownType() throws Exception {
        mockMvc.perform(post("/places")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"INCONNU\",\"label\":\"Tahiti\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La valeur du champ 'type' est invalide."));

        verifyNoInteractions(service);
    }

    @Test
    void testMalformedJsonUsesErrorMessageFormat() throws Exception {
        mockMvc.perform(post("/places")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{invalide"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La requête est invalide."));
    }

    @Test
    void testInvalidIdUsesErrorMessageFormat() throws Exception {
        mockMvc.perform(get("/places/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La requête est invalide."));
    }

    @Test
    void testUnknownRouteUsesNotFoundMessage() throws Exception {
        mockMvc.perform(get("/inconnu"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("La ressource demandée n'existe pas."));
    }

    @Test
    void testUnexpectedException() throws Exception {
        when(service.findById(1L)).thenThrow(new IllegalStateException("boom"));

        mockMvc.perform(get("/places/1"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Une erreur inattendue s'est produite."));
    }

    @Test
    void testDeletePlace() throws Exception {
        mockMvc.perform(delete("/places/1"))
                .andExpect(status().isNoContent());

        verify(service).deleteById(1L);
    }

    private static ZoneOffsetFixedPlace zoneOffsetFixedPlace(Long id) {
        var place = new ZoneOffsetFixedPlace();
        place.setId(id);
        place.setLabel("Tahiti");
        place.setZoneOffset(ZoneOffset.of("-10:00"));
        return place;
    }

    private static ZoneIdPlace zoneIdPlace(Long id) {
        var place = new ZoneIdPlace();
        place.setId(id);
        place.setLabel("Paris");
        place.setZoneId(ZoneId.of("Europe/Paris"));
        return place;
    }
}
