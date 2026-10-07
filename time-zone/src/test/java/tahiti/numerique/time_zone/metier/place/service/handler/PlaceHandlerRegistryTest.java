package tahiti.numerique.time_zone.metier.place.service.handler;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import tahiti.numerique.time_zone.metier.place.controller.ZoneIdPlaceRequest;
import tahiti.numerique.time_zone.metier.place.controller.ZoneOffsetFixedPlaceRequest;
import tahiti.numerique.time_zone.metier.place.mapper.PlaceMapper;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class PlaceHandlerRegistryTest {

    private final PlaceMapper placeMapper = mock(PlaceMapper.class);
    private final ZoneOffsetFixedPlaceHandler zoneOffsetFixedPlaceHandler = new ZoneOffsetFixedPlaceHandler(placeMapper);
    private final ZoneIdPlaceHandler zoneIdPlaceHandler = new ZoneIdPlaceHandler(placeMapper);

    @Test
    void testHandlerForEachRequestType() {
        var registry = new PlaceHandlerRegistry(List.of(zoneOffsetFixedPlaceHandler, zoneIdPlaceHandler));
        registry.afterSingletonsInstantiated();

        assertSame(zoneOffsetFixedPlaceHandler, registry.handlerFor(new ZoneOffsetFixedPlaceRequest()));
        assertSame(zoneIdPlaceHandler, registry.handlerFor(new ZoneIdPlaceRequest()));
    }

    @Test
    void testHandlerForBeforeInitialization() {
        var registry = new PlaceHandlerRegistry(List.of(zoneOffsetFixedPlaceHandler, zoneIdPlaceHandler));

        assertThrows(IllegalStateException.class, () -> registry.handlerFor(new ZoneIdPlaceRequest()));
    }

    @Test
    void testHandlerMissing() {
        var registry = new PlaceHandlerRegistry(List.of(zoneOffsetFixedPlaceHandler));

        var exception = assertThrows(IllegalStateException.class, registry::afterSingletonsInstantiated);
        assertEquals("Aucun PlaceHandler pour " + ZoneIdPlaceRequest.class.getName(), exception.getMessage());
    }

    @Test
    void testHandlerDuplicated() {
        var registry = new PlaceHandlerRegistry(
                List.of(zoneOffsetFixedPlaceHandler, zoneIdPlaceHandler, new ZoneIdPlaceHandler(placeMapper)));

        var exception = assertThrows(IllegalStateException.class, registry::afterSingletonsInstantiated);
        assertTrue(exception.getMessage().startsWith("Plusieurs PlaceHandler pour " + ZoneIdPlaceRequest.class.getName()));
    }

    @Test
    void testContextFailsToStartWhenHandlerMissing() {
        new ApplicationContextRunner()
                .withBean(PlaceMapper.class, () -> placeMapper)
                .withBean(ZoneOffsetFixedPlaceHandler.class)
                .withBean(PlaceHandlerRegistry.class)
                .run(context -> assertThat(context).getFailure()
                        .isInstanceOf(IllegalStateException.class)
                        .hasMessage("Aucun PlaceHandler pour " + ZoneIdPlaceRequest.class.getName()));
    }
}
