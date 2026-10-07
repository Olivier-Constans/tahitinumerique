package tahiti.numerique.time_zone.metier.place.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tahiti.numerique.time_zone.core.controller.PageResponse;
import tahiti.numerique.time_zone.metier.place.mapper.CalculateDateMapper;
import tahiti.numerique.time_zone.metier.place.mapper.PlaceMapper;
import tahiti.numerique.time_zone.metier.place.service.PlaceService;

import java.time.ZoneOffset;
import java.util.List;

@RestController
@RequestMapping("/places")
@RequiredArgsConstructor
public class PlaceController {

    private final PlaceService service;
    private final PlaceMapper mapper;
    private final CalculateDateMapper calculateDateMapper;

    @GetMapping
    public ResponseEntity<PageResponse<PlaceResponse>> getAllPlaces(
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(PageResponse.of(service.findAll(pageable), mapper::mapToResponse));
    }

    @PostMapping
    public ResponseEntity<PlaceResponse> createPlace(@RequestBody PlaceRequest form) {
        var response = mapper.mapToResponse(service.create(form));
        var location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.getId())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlaceResponse> getPlaceById(@PathVariable Long id) {
        return ResponseEntity.ok(mapper.mapToResponse(service.findById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlaceResponse> updatePlace(@PathVariable Long id, @RequestBody PlaceRequest form) {
        return ResponseEntity.ok(mapper.mapToResponse(service.update(id, form)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlace(@PathVariable Long id) {
        this.service.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Zones IANA acceptées pour un lieu de type {@code ZONE_ID}.
     */
    @GetMapping("/zone-ids")
    public ResponseEntity<List<String>> getAllZoneIds() {
        return ResponseEntity.ok(service.findAllZoneIds());
    }

    /**
     * Décalages acceptés pour un lieu de type {@code ZONE_OFFSET_FIXED}, triés, au format ISO-8601 ({@code Z} pour UTC).
     */
    @GetMapping("/zone-offsets")
    public ResponseEntity<List<String>> getAllZoneOffsets() {
        return ResponseEntity.ok(service.findAllZoneOffsets().stream().map(ZoneOffset::getId).toList());
    }

    @PostMapping("/calculate-date")
    public ResponseEntity<CalculateDateResponse> calculateDate(@RequestBody CalculateDateRequest form) {
        return  ResponseEntity.ok(this.calculateDateMapper.mapToResponse(this.service.calculateDate(form)));
    }

}
