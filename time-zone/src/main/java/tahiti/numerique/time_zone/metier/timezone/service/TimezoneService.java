package tahiti.numerique.time_zone.metier.timezone.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tahiti.numerique.time_zone.core.exception.NotFoundException;
import tahiti.numerique.time_zone.core.validator.ObjectValidator;
import tahiti.numerique.time_zone.metier.timezone.controller.CalculateDateRequest;
import tahiti.numerique.time_zone.metier.timezone.controller.TimezoneRequest;
import tahiti.numerique.time_zone.metier.timezone.mapper.TimezoneMapper;
import tahiti.numerique.time_zone.persistence.OffsetUTC;
import tahiti.numerique.time_zone.persistence.timezone.Timezone;
import tahiti.numerique.time_zone.persistence.timezone.TimezoneRepository;

import java.time.OffsetDateTime;

@Service
@Transactional
@RequiredArgsConstructor
public class TimezoneService {

    private final TimezoneRepository timezoneRepository;
    private final TimezoneMapper timezoneMapper;

    public Page<Timezone> findAll(Pageable pageable) {
        return timezoneRepository.findAll(pageable);
    }

    public Timezone findById(Long id) {
        return timezoneRepository.findById(id).orElseThrow(() -> new NotFoundException("timezone", id));
    }

    public Timezone create(TimezoneRequest form) {
        return save(new Timezone(), form);
    }

    public Timezone update(Long id, TimezoneRequest form) {
        var timezone = findById(id);
        return save(timezone, form);
    }

    private Timezone save(Timezone timezone, TimezoneRequest form) {
        ObjectValidator.required(form.getLabel(), TimezoneRequest.Fields.label);
        ObjectValidator.required(form.getOffsetUTC(), TimezoneRequest.Fields.offsetUTC);
        ObjectValidator.valid(OffsetUTC.getEnumForLabel(form.getOffsetUTC()), TimezoneRequest.Fields.offsetUTC);

        timezoneMapper.populate(timezone, form);
        return timezoneRepository.save(timezone);
    }

    public void deleteById(Long id) {
        var timezone = findById(id);
        timezoneRepository.delete(timezone);
    }

    public CalculateDate calculateDate(CalculateDateRequest form) {

        ObjectValidator.required(form.getDate(), CalculateDateRequest.Fields.date);
        ObjectValidator.required(form.getTimezone(), CalculateDateRequest.Fields.timezone);
        ObjectValidator.required(form.getTimezone().getId(), CalculateDateRequest.Fields.timezone);

        var timezoneForm = ObjectValidator.exist(
                this.timezoneRepository, form.getTimezone().getId(), CalculateDateRequest.Fields.timezone);

        var offsetDateTime = OffsetDateTime.of(form.getDate(), timezoneForm.getOffsetUTC().getZoneOffset());

        var resultat = new CalculateDate();
        timezoneRepository.findAll().forEach(timezone -> {
            if (timezone.getId().equals(timezoneForm.getId())) {
                return;
            }
            resultat.getCalculateDateItemList().add(new CalculateDate.CalculateDateItem(
                    timezone,
                    offsetDateTime.withOffsetSameInstant(timezone.getOffsetUTC().getZoneOffset()).toLocalDateTime()
            ));
        });
        return resultat;
    }

}
