package com.romsteam.roms.service;

import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.repository.CategoryRepository;
import com.romsteam.roms.repository.MenuItemRepository;
import com.romsteam.roms.service.serviceImpl.MenuServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class MenuServiceTest {

    @Mock
    private MenuItemRepository menuItemRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private RealtimeService realtimeService;

    private MenuServiceImpl menuService;

    @TempDir
    Path tempUploadDir;

    @BeforeEach
    void setUp() {
        menuService = new MenuServiceImpl(menuItemRepository, categoryRepository, realtimeService);
        ReflectionTestUtils.setField(menuService, "uploadDir", tempUploadDir.toString());
    }

    @Test
    @DisplayName("1. Tải lên file rỗng hoặc null sẽ ném ngoại lệ AppException")
    void uploadDishImage_WhenEmptyFile_ThrowsException() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "test.jpg", "image/jpeg", new byte[0]);

        assertThatThrownBy(() -> menuService.uploadDishImage(emptyFile))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Vui lòng chọn file hình ảnh hợp lệ");
    }

    @Test
    @DisplayName("2. Tải lên file không phải định dạng ảnh sẽ bị từ chối")
    void uploadDishImage_WhenInvalidExtension_ThrowsException() {
        MockMultipartFile exeFile = new MockMultipartFile(
                "file",
                "script.exe",
                "application/octet-stream",
                "malicious script".getBytes()
        );

        assertThatThrownBy(() -> menuService.uploadDishImage(exeFile))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Định dạng file không hợp lệ");
    }

    @Test
    @DisplayName("3. Tải lên file ảnh hợp lệ (PNG/JPG) thành công và trả về URL ảnh")
    void uploadDishImage_WhenValidImage_ReturnsUploadedUrl() {
        byte[] fakeImageContent = new byte[]{ (byte) 0x89, 'P', 'N', 'G', 1, 2, 3, 4 };
        MockMultipartFile validFile = new MockMultipartFile(
                "file",
                "delicious-dish.png",
                "image/png",
                fakeImageContent
        );

        String resultUrl = menuService.uploadDishImage(validFile);

        assertThat(resultUrl)
                .isNotNull()
                .startsWith("/api/uploads/menu/dish-")
                .endsWith(".png");
    }
}
