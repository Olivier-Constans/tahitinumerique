package tahiti.numerique.time_zone.metier.place.controller;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests de l'API sur la pile complète (service + repository + H2).
 */
@SpringBootTest
@AutoConfigureMockMvc
class PlaceApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testGetAllPlacesSortedByExistingProperty() throws Exception {
        mockMvc.perform(get("/places").param("sort", "label,desc"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetAllPlacesWithUnknownSortProperty() throws Exception {
        mockMvc.perform(get("/places").param("sort", "foo"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La requête est invalide."));
    }

    @Test
    void testCrudAndTypeChange() throws Exception {
        var id = create("{\"type\":\"ZONE_OFFSET_FIXED\",\"label\":\"Tahiti\",\"zoneOffset\":\"-10:00\"}");

        mockMvc.perform(get("/places/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("ZONE_OFFSET_FIXED"))
                .andExpect(jsonPath("$.zoneOffset").value("-10:00"));

        // Passage en zone IANA : même id, la création est conservée
        var createDate = JsonPath.read(read(id), "$.audit.createDate");
        mockMvc.perform(put("/places/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"ZONE_ID\",\"label\":\"Papeete\",\"zoneId\":\"Pacific/Tahiti\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.type").value("ZONE_ID"))
                .andExpect(jsonPath("$.label").value("Papeete"))
                .andExpect(jsonPath("$.zoneId").value("Pacific/Tahiti"))
                .andExpect(jsonPath("$.audit.createDate").value(createDate));

        // Retour au décalage fixe
        mockMvc.perform(put("/places/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"ZONE_OFFSET_FIXED\",\"label\":\"Papeete\",\"zoneOffset\":\"-10:00\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("ZONE_OFFSET_FIXED"))
                .andExpect(jsonPath("$.zoneOffset").value("-10:00"))
                .andExpect(jsonPath("$.zoneId").doesNotExist());

        mockMvc.perform(delete("/places/{id}", id)).andExpect(status().isNoContent());
        mockMvc.perform(get("/places/{id}", id)).andExpect(status().isNotFound());
    }

    @Test
    void testInvalidTypeChangeKeepsPlace() throws Exception {
        var id = create("{\"type\":\"ZONE_OFFSET_FIXED\",\"label\":\"Tahiti\",\"zoneOffset\":\"-10:00\"}");

        mockMvc.perform(put("/places/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"ZONE_ID\",\"label\":\"Tahiti\",\"zoneId\":\"Mars/Olympus\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La valeur du champ 'zoneId' est invalide."));

        mockMvc.perform(get("/places/{id}", id))
                .andExpect(jsonPath("$.type").value("ZONE_OFFSET_FIXED"))
                .andExpect(jsonPath("$.zoneOffset").value("-10:00"));

        mockMvc.perform(delete("/places/{id}", id)).andExpect(status().isNoContent());
    }

    @Test
    void testCalculateDateBetweenImplementations() throws Exception {
        var tahiti = create("{\"type\":\"ZONE_OFFSET_FIXED\",\"label\":\"Tahiti\",\"zoneOffset\":\"-10:00\"}");
        var paris = create("{\"type\":\"ZONE_ID\",\"label\":\"Paris\",\"zoneId\":\"Europe/Paris\"}");

        mockMvc.perform(post("/places/calculate-date")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"placeId\":" + tahiti + ",\"date\":\"2026-07-01T12:00:00\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.calculateDateItemList[?(@.place.id == " + paris + ")].date").value("2026-07-02T00:00:00"));

        mockMvc.perform(delete("/places/{id}", tahiti)).andExpect(status().isNoContent());
        mockMvc.perform(delete("/places/{id}", paris)).andExpect(status().isNoContent());
    }

    private int create(String json) throws Exception {
        var body = mockMvc.perform(post("/places").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.id");
    }

    private String read(int id) throws Exception {
        return mockMvc.perform(get("/places/{id}", id))
                .andReturn().getResponse().getContentAsString();
    }
}
