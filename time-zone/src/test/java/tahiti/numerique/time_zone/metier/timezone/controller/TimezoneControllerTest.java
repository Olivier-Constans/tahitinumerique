package tahiti.numerique.time_zone.metier.timezone.controller;

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
import tahiti.numerique.time_zone.metier.timezone.mapper.CalculateDateMapperImpl;
import tahiti.numerique.time_zone.metier.timezone.mapper.TimezoneMapperImpl;
import tahiti.numerique.time_zone.metier.timezone.service.TimezoneService;
import tahiti.numerique.time_zone.persistence.OffsetUTC;
import tahiti.numerique.time_zone.persistence.timezone.Timezone;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static tahiti.numerique.time_zone.core.validator.MessageCode.GENERIC_FORM_REQUIRED;

@WebMvcTest(TimezoneController.class)
@Import({TimezoneMapperImpl.class, AuditMapperImpl.class, CalculateDateMapperImpl.class})
class TimezoneControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TimezoneService service;

    @Test
    void testGetAllTimezones() throws Exception {
        var pageable = PageRequest.of(0, 10);
        when(service.findAll(any())).thenReturn(new PageImpl<>(List.of(timezone(1L)), pageable, 11));

        mockMvc.perform(get("/timezones").param("page", "0").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].offsetUTC").value("UTC-10"))
                .andExpect(jsonPath("$.totalElements").value(11))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.size").value(10));
    }

    @Test
    void testCreateTimezone() throws Exception {
        when(service.create(any())).thenReturn(timezone(5L));

        mockMvc.perform(post("/timezones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"label\":\"Tahiti\",\"offsetUTC\":\"UTC-10\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "http://localhost/timezones/5"))
                .andExpect(jsonPath("$.id").value(5));
    }

    @Test
    void testGetTimezoneByIdNotFound() throws Exception {
        when(service.findById(1234L)).thenThrow(new NotFoundException("timezone", 1234L));

        mockMvc.perform(get("/timezones/1234"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("L'objet timezone d'id '1234' n'a pas été trouvé."));
    }

    @Test
    void testBusinessException() throws Exception {
        when(service.create(any())).thenThrow(new BusinessException(GENERIC_FORM_REQUIRED, new Object[]{"label"}));

        mockMvc.perform(post("/timezones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Le champ 'label' est obligatoire."));
    }

    @Test
    void testMalformedJsonUsesErrorMessageFormat() throws Exception {
        mockMvc.perform(post("/timezones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{invalide"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La requête est invalide."));
    }

    @Test
    void testInvalidIdUsesErrorMessageFormat() throws Exception {
        mockMvc.perform(get("/timezones/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La requête est invalide."));
    }

    @Test
    void testUnexpectedException() throws Exception {
        when(service.findById(1L)).thenThrow(new IllegalStateException("boom"));

        mockMvc.perform(get("/timezones/1"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Une erreur inattendue s'est produite."));
    }

    @Test
    void testDeleteTimezone() throws Exception {
        mockMvc.perform(delete("/timezones/1"))
                .andExpect(status().isNoContent());

        verify(service).deleteById(1L);
    }

    private static Timezone timezone(Long id) {
        var timezone = new Timezone();
        timezone.setId(id);
        timezone.setLabel("Tahiti");
        timezone.setOffsetUTC(OffsetUTC.UTC_MINUS_10);
        return timezone;
    }
}
