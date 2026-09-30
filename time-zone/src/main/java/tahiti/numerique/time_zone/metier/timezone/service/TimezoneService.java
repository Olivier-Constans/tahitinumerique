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

    @Transactional(readOnly = true)
    public Page<Timezone> findAll(Pageable pageable) {
        return timezoneRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
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
        ObjectValidator.notBlank(form.getLabel(), TimezoneRequest.Fields.label);
        ObjectValidator.maxLength(form.getLabel(), Timezone.LABEL_MAX_LENGTH, TimezoneRequest.Fields.label);
        ObjectValidator.required(form.getOffsetUTC(), TimezoneRequest.Fields.offsetUTC);
        var offsetUTC = OffsetUTC.getEnumForLabel(form.getOffsetUTC());
        ObjectValidator.valid(offsetUTC != null, TimezoneRequest.Fields.offsetUTC);

        timezoneMapper.populate(timezone, form);
        timezone.setOffsetUTC(offsetUTC);
        return timezoneRepository.save(timezone);
    }

    public void deleteById(Long id) {
        var timezone = findById(id);
        timezoneRepository.delete(timezone);
    }

    @Transactional(readOnly = true)
    public CalculateDate calculateDate(CalculateDateRequest form) {

        ObjectValidator.required(form.getDate(), CalculateDateRequest.Fields.date);
        ObjectValidator.required(form.getTimezoneId(), CalculateDateRequest.Fields.timezoneId);

        var timezoneForm = ObjectValidator.exist(
                this.timezoneRepository, form.getTimezoneId(), CalculateDateRequest.Fields.timezoneId);

        var offsetDateTime = OffsetDateTime.of(form.getDate(), timezoneForm.getOffsetUTC().getZoneOffset());

        var resultat = new CalculateDate();

        timezoneRepository.findAllByIdNot(timezoneForm.getId()).forEach(timezone ->
            resultat.getCalculateDateItemList().add(new CalculateDate.CalculateDateItem(
                    timezone,
                    offsetDateTime.withOffsetSameInstant(timezone.getOffsetUTC().getZoneOffset()).toLocalDateTime()
            )));
        return resultat;
    }

}
