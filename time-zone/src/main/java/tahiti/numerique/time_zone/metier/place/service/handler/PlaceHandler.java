package tahiti.numerique.time_zone.metier.place.service.handler;

import tahiti.numerique.time_zone.metier.place.controller.PlaceRequest;
import tahiti.numerique.time_zone.persistence.place.Place;

/**
 * Traitements propres à un type de lieu : une implémentation par sous-classe de {@link PlaceRequest},
 * ce que {@link PlaceHandlerRegistry} vérifie au démarrage.
 *
 * @param <R> la requête du type de lieu
 * @param <P> l'entité du type de lieu
 */
public interface PlaceHandler<R extends PlaceRequest, P extends Place> {

    Class<R> requestType();

    Class<P> placeType();

    P newPlace();

    /**
     * Valide les champs propres au type ; les champs communs sont validés par {@code PlaceService}.
     */
    void validate(R form);

    /**
     * Renseigne le lieu à partir d'un formulaire déjà validé.
     */
    void populate(P place, R form);
}
