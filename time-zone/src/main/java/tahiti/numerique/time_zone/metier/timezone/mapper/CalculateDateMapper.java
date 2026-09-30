package tahiti.numerique.time_zone.metier.timezone.mapper;

import org.mapstruct.Mapper;
import tahiti.numerique.time_zone.metier.timezone.controller.CalculateDateResponse;
import tahiti.numerique.time_zone.metier.timezone.service.CalculateDate;
@Mapper(componentModel = "spring", uses = {TimezoneMapper.class})
public interface CalculateDateMapper {

    CalculateDateResponse.CalculateDateItemResponse mapToResponse(CalculateDate.CalculateDateItem calculateDateItem);

    CalculateDateResponse mapToResponse(CalculateDate calculateDate);
}
