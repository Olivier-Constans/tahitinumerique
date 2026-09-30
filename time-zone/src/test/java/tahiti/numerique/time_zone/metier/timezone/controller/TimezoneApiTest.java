package tahiti.numerique.time_zone.metier.timezone.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests de l'API sur la pile complète (service + repository + H2).
 */
@SpringBootTest
@AutoConfigureMockMvc
class TimezoneApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testGetAllTimezonesSortedByExistingProperty() throws Exception {
        mockMvc.perform(get("/timezones").param("sort", "label,desc"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetAllTimezonesWithUnknownSortProperty() throws Exception {
        mockMvc.perform(get("/timezones").param("sort", "foo"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La requête est invalide."));
    }
}
