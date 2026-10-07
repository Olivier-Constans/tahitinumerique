package tahiti.numerique.time_zone.metier.place.mapper;

import org.mapstruct.Mapper;
import tahiti.numerique.time_zone.metier.place.controller.CalculateDateResponse;
import tahiti.numerique.time_zone.metier.place.service.CalculateDate;
@Mapper(componentModel = "spring", uses = {PlaceMapper.class})
public interface CalculateDateMapper {

    CalculateDateResponse.CalculateDateItemResponse mapToResponse(CalculateDate.CalculateDateItem calculateDateItem);

    CalculateDateResponse mapToResponse(CalculateDate calculateDate);
}
