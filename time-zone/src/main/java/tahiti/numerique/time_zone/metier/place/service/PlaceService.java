package tahiti.numerique.time_zone.metier.place.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tahiti.numerique.time_zone.core.exception.NotFoundException;
import tahiti.numerique.time_zone.core.validator.ObjectValidator;
import tahiti.numerique.time_zone.metier.place.controller.CalculateDateRequest;
import tahiti.numerique.time_zone.metier.place.controller.PlaceRequest;
import tahiti.numerique.time_zone.metier.place.service.handler.PlaceHandler;
import tahiti.numerique.time_zone.metier.place.service.handler.PlaceHandlerRegistry;
import tahiti.numerique.time_zone.metier.place.service.handler.ZoneIdPlaceHandler;
import tahiti.numerique.time_zone.metier.place.service.handler.ZoneOffsetFixedPlaceHandler;
import tahiti.numerique.time_zone.persistence.place.Place;
import tahiti.numerique.time_zone.persistence.place.PlaceRepository;

import java.time.ZoneOffset;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class PlaceService {

    private final PlaceRepository placeRepository;
    private final PlaceHandlerRegistry placeHandlerRegistry;

    @Transactional(readOnly = true)
    public Page<Place> findAll(Pageable pageable) {
        return placeRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Place findById(Long id) {
        return placeRepository.findById(id).orElseThrow(() -> new NotFoundException("place", id));
    }

    public List<String> findAllZoneIds() {
        return ZoneIdPlaceHandler.ZONE_IDS;
    }

    public List<ZoneOffset> findAllZoneOffsets() {
        return ZoneOffsetFixedPlaceHandler.ZONE_OFFSETS;
    }

    public Place create(PlaceRequest form) {
        var handler = placeHandlerRegistry.handlerFor(form);
        validate(handler, form);
        return save(handler, handler.newPlace(), form);
    }

    public Place update(Long id, PlaceRequest form) {
        var place = findById(id);
        var handler = placeHandlerRegistry.handlerFor(form);
        validate(handler, form);
        if (!handler.placeType().isInstance(place)) {
            placeRepository.changeType(id, form.getType());
            place = findById(id);
        }
        return save(handler, place, form);
    }

    private <R extends PlaceRequest> void validate(PlaceHandler<R, ?> handler, PlaceRequest form) {
        ObjectValidator.notBlank(form.getLabel(), PlaceRequest.Fields.label);
        ObjectValidator.maxLength(form.getLabel(), Place.LABEL_MAX_LENGTH, PlaceRequest.Fields.label);
        handler.validate(handler.requestType().cast(form));
    }

    /**
     * {@code place} est du type géré par {@code handler} : créé par lui, ou converti par {@link #update}.
     */
    private <R extends PlaceRequest, P extends Place> Place save(PlaceHandler<R, P> handler, Place place, PlaceRequest form) {
        var typedPlace = handler.placeType().cast(place);
        handler.populate(typedPlace, handler.requestType().cast(form));
        return placeRepository.save(typedPlace);
    }

    public void deleteById(Long id) {
        var place = findById(id);
        placeRepository.delete(place);
    }

    /**
     * La date saisie est l'heure locale du lieu {@code placeId}. Pour une zone IANA, le décalage appliqué est
     * celui en vigueur à cette date (heure d'été ou d'hiver).
     */
    @Transactional(readOnly = true)
    public CalculateDate calculateDate(CalculateDateRequest form) {

        ObjectValidator.required(form.getDate(), CalculateDateRequest.Fields.date);
        ObjectValidator.required(form.getPlaceId(), CalculateDateRequest.Fields.placeId);

        var placeForm = ObjectValidator.exist(this.placeRepository, form.getPlaceId(), CalculateDateRequest.Fields.placeId);

        var zonedDateTime = form.getDate().atZone(placeForm.toZoneId());

        var resultat = new CalculateDate();

        placeRepository.findAllByIdNot(placeForm.getId()).forEach(place ->
            resultat.getCalculateDateItemList().add(new CalculateDate.CalculateDateItem(
                    place,
                    zonedDateTime.withZoneSameInstant(place.toZoneId()).toLocalDateTime()
            )));
        return resultat;
    }

}
