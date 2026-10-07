package tahiti.numerique.time_zone.metier.place.service;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import tahiti.numerique.time_zone.persistence.place.Place;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class CalculateDate {

    private List<CalculateDateItem> calculateDateItemList = new ArrayList<>();

    @Getter
    @Setter
    @AllArgsConstructor
    public static class CalculateDateItem {
        private Place place;
        private LocalDateTime date;
    }
}
