import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { userAPI } from '@/services/api'
import toast from 'react-hot-toast'
import Cropper from 'react-easy-crop'
import { ArrowLeft, Mail, Phone, MapPin, User, Building, Briefcase, Calendar, DollarSign, TrendingUp, Upload, X, Check } from 'lucide-react'

const StaffDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [imageSrc, setImageSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  useEffect(() => {
    if (id) {
      fetchStaffDetail(id)
    }
  }, [id])

  const fetchStaffDetail = async (staffId) => {
    try {
      setLoading(true)
      const res = await userAPI.getById(staffId)
      setStaff(res.data)
    } catch (error) {
      toast.error('Không thể tải thông tin nhân viên')
      navigate('/staff')
    } finally {
      setLoading(false)
    }
  }

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.src = url
    })

  const getCroppedImg = async (imageSrc, pixelCrop, quality = 0.6) => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // Giảm kích thước xuống 300x300 để giảm dung lượng
    const maxSize = 300
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = maxSize
    canvas.height = maxSize

    ctx.imageSmoothingQuality = 'high'

    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      maxSize,
      maxSize
    )

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'))
            return
          }
          
          // Nếu blob > 500KB và quality > 0.4, thử lại với quality thấp hơn
          if (blob.size > 500 * 1024 && quality > 0.4) {
            getCroppedImg(imageSrc, pixelCrop, quality - 0.1).then(resolve).catch(reject)
          } else {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.onerror = () => reject(new Error('Failed to read blob'))
            reader.readAsDataURL(blob)
          }
        },
        'image/jpeg',
        quality
      )
    })
  }

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleCropComplete = async () => {
    if (!croppedAreaPixels || !imageSrc) return

    try {
      setUploading(true)
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
      
      // Kiểm tra kích thước sau khi crop (giới hạn 1MB để an toàn)
      const base64Size = (croppedImage.length * 3) / 4
      if (base64Size > 1 * 1024 * 1024) {
        toast.error('Ảnh sau khi cắt vẫn quá lớn. Vui lòng chọn ảnh khác hoặc giảm chất lượng.')
        setShowCropModal(false)
        setImageSrc(null)
        return
      }

      await userAPI.update(id, { avatar_url: croppedImage })
      toast.success('Cập nhật ảnh đại diện thành công')
      await fetchStaffDetail(id)
      setShowCropModal(false)
      setImageSrc(null)
    } catch (error) {
      toast.error('Không thể cập nhật ảnh đại diện')
    } finally {
      setUploading(false)
    }
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh')
      return
    }

    // Nếu file quá lớn (>5MB), mở modal crop
    if (file.size > 5 * 1024 * 1024) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageSrc(reader.result)
        setShowCropModal(true)
      }
      reader.readAsDataURL(file)
      return
    }

    // Nếu file nhỏ, upload trực tiếp
    try {
      setUploading(true)
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result
        try {
          await userAPI.update(id, { avatar_url: base64String })
          toast.success('Cập nhật ảnh đại diện thành công')
          await fetchStaffDetail(id)
        } catch (error) {
          toast.error('Không thể cập nhật ảnh đại diện')
        } finally {
          setUploading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error('Không thể đọc file ảnh')
      setUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      setUploading(true)
      await userAPI.update(id, { avatar_url: null })
      toast.success('Đã xóa ảnh đại diện')
      await fetchStaffDetail(id)
    } catch (error) {
      toast.error('Không thể xóa ảnh đại diện')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Đang tải thông tin nhân viên...</div>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Không tìm thấy thông tin nhân viên</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="relative group">
              {staff.avatar_url ? (
                <div className="relative">
                  <img 
                    src={staff.avatar_url} 
                    alt={staff.full_name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={uploading}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Xóa ảnh"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {staff.full_name?.charAt(0)?.toUpperCase() || 'N'}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 shadow-lg"
                title="Thay đổi ảnh đại diện"
              >
                <Upload className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{staff.full_name}</h1>
              <p className="text-sm text-gray-500 mt-1">Mã nhân viên: {staff.user_id}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  staff.active === 'Đang làm việc' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {staff.active}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/staff')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-gray-700 hover:text-gray-900 hover:border-gray-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại danh sách</span>
          </button>
        </div>
      </div>

      {/* Thông tin cá nhân */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Thông tin cá nhân
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Giới tính</label>
            <p className="text-base text-gray-900 mt-1">{staff.gender || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <p className="text-base text-gray-900 mt-1">{staff.email || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Số điện thoại
            </label>
            <p className="text-base text-gray-900 mt-1">{staff.phone || '-'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Địa chỉ
            </label>
            <p className="text-base text-gray-900 mt-1">{staff.address || '-'}</p>
          </div>
        </div>
      </div>

      {/* Thông tin công tác */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building className="w-5 h-5" />
          Thông tin công tác
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Chức vụ
            </label>
            <p className="text-base text-gray-900 mt-1">{staff.position || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Đơn vị
            </label>
            <p className="text-base text-gray-900 mt-1">{staff.OrganizationUnit?.name || '-'}</p>
          </div>
        </div>
      </div>

      {/* Thông tin lương và hợp đồng */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Thông tin lương và hợp đồng
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Ngày vào làm
            </label>
            <p className="text-base text-gray-900 mt-1">
              {staff.hire_date 
                ? new Date(staff.hire_date).toLocaleDateString('vi-VN')
                : '-'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Hệ số lương
            </label>
            <p className="text-base text-gray-900 mt-1">
              {staff.salary_coefficient ? staff.salary_coefficient : '-'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Bậc lương
            </label>
            <p className="text-base text-gray-900 mt-1">
              {staff.salary_level ? staff.salary_level : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && imageSrc && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Cắt ảnh đại diện</h3>
              <p className="text-sm text-gray-500 mt-1">Kéo để di chuyển, cuộn để phóng to/thu nhỏ</p>
            </div>
            <div className="relative flex-1" style={{ height: '400px' }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
              />
            </div>
            <div className="p-6 border-t flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <label className="text-sm font-medium text-gray-700">Phóng to</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 w-12 text-right">{zoom.toFixed(1)}x</span>
              </div>
              <div className="flex space-x-3 ml-6">
                <button
                  onClick={() => {
                    setShowCropModal(false)
                    setImageSrc(null)
                    setCrop({ x: 0, y: 0 })
                    setZoom(1)
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={uploading}
                >
                  Hủy
                </button>
                <button
                  onClick={handleCropComplete}
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{uploading ? 'Đang xử lý...' : 'Xác nhận'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffDetail

