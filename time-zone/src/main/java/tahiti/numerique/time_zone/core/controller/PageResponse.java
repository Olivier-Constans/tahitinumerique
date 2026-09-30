package tahiti.numerique.time_zone.core.controller;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/**
 * Représentation JSON stable d'une page (la sérialisation directe de PageImpl n'est pas garantie par Spring Data).
 */
public record PageResponse<T>(
        List<T> content,
        long totalElements,
        int totalPages,
        int number,
        int size
) {

    public static <S, T> PageResponse<T> of(Page<S> page, Function<S, T> mapper) {
        return new PageResponse<>(
                page.map(mapper).getContent(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize()
        );
    }
}
