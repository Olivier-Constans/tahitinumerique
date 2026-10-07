package tahiti.numerique.time_zone.metier.place.service.handler;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.stereotype.Component;
import tahiti.numerique.time_zone.metier.place.controller.PlaceRequest;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Répertoire des {@link PlaceHandler}, indexés par type de requête.
 * L'index est construit et vérifié une fois tous les singletons créés, avant le démarrage du serveur web :
 * s'il manque une stratégie pour une sous-classe de {@link PlaceRequest}, ou s'il y en a deux,
 * le démarrage de l'application est interrompu.
 */
@Component
@RequiredArgsConstructor
public class PlaceHandlerRegistry implements SmartInitializingSingleton {

    private final List<PlaceHandler<?, ?>> placeHandlers;

    private Map<Class<?>, PlaceHandler<?, ?>> handlersByRequestType = Map.of();

    @Override
    public void afterSingletonsInstantiated() {
        var errors = Arrays.stream(PlaceRequest.class.getPermittedSubclasses())
                .map(this::verify)
                .filter(error -> !error.isEmpty())
                .toList();
        if (!errors.isEmpty()) {
            throw new IllegalStateException(String.join(" ; ", errors));
        }
        handlersByRequestType = placeHandlers.stream()
                .collect(Collectors.toUnmodifiableMap(PlaceHandler::requestType, Function.identity()));
    }

    public PlaceHandler<?, ?> handlerFor(PlaceRequest form) {
        var handler = handlersByRequestType.get(form.getClass());
        if (handler == null) {
            throw new IllegalStateException("Aucun PlaceHandler pour " + form.getClass().getName());
        }
        return handler;
    }

    private String verify(Class<?> requestType) {
        var handlers = placeHandlers.stream()
                .filter(handler -> handler.requestType().equals(requestType))
                .map(handler -> handler.getClass().getName())
                .toList();
        return switch (handlers.size()) {
            case 0 -> "Aucun PlaceHandler pour " + requestType.getName();
            case 1 -> "";
            default -> "Plusieurs PlaceHandler pour " + requestType.getName() + " : " + String.join(", ", handlers);
        };
    }
}
