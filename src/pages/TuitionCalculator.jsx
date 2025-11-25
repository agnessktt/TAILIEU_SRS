import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { majorAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function TuitionCalculator() {
  const navigate = useNavigate();
  const [majorsWithPrograms, setMajorsWithPrograms] = useState([]);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  useEffect(() => {
    loadMajorsWithPrograms();
  }, []);

  const loadMajorsWithPrograms = async () => {
    try {
      setLoadingMajors(true);
      const response = await majorAPI.getMajorsWithLatestPrograms();
      setMajorsWithPrograms(response.data || []);
    } catch (error) {
      toast.error(error.message || 'Không thể tải danh sách ngành học');
    } finally {
      setLoadingMajors(false);
    }
  };

  const filteredMajors = majorsWithPrograms.filter((major) => {
    const keyword = searchTerm.trim().toLowerCase();
    const yearKeyword = yearFilter.trim();

    const matchKeyword =
      !keyword ||
      (major.major_name && major.major_name.toLowerCase().includes(keyword)) ||
      (major.major_code && major.major_code.toLowerCase().includes(keyword));

    const matchYear =
      !yearKeyword ||
      (major.latest_year && String(major.latest_year).includes(yearKeyword)) ||
      (Array.isArray(major.programs) &&
        major.programs.some((program) =>
          program.start_year && String(program.start_year).includes(yearKeyword)
        ));

    return matchKeyword && matchYear;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Danh sách ngành với chương trình đào tạo của năm mới nhất */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Tính học phí</h2>
        <p className="text-gray-600 mb-6">Danh sách các ngành đào tạo với chương trình đào tạo của năm mới nhất</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mb-6">
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo mã hoặc tên ngành..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="text"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              placeholder="Lọc theo năm bắt đầu chương trình..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loadingMajors ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        ) : filteredMajors.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Không có dữ liệu ngành học</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMajors.map(major => (
              <div key={major.id} className="bg-white border rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {major.major_code} - {major.major_name}
                    </h3>
                    {major.latest_year && (
                      <p className="text-sm text-gray-500 mt-1">
                        Năm mới nhất: {major.latest_year}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/hoc-phi/${major.id}`)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                  >
                    Xem chi tiết
                  </button>
                </div>

                {major.programs && major.programs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-left">Mã chương trình</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Tên chương trình</th>
                          <th className="border border-gray-300 px-4 py-2 text-center">Năm bắt đầu</th>
                          <th className="border border-gray-300 px-4 py-2 text-center">Tổng tín chỉ</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">Giá tín chỉ</th>
                          <th className="border border-gray-300 px-4 py-2 text-right">Học phí tối thiểu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {major.programs.map(program => (
                          <tr key={program.id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2">{program.program_code}</td>
                            <td className="border border-gray-300 px-4 py-2">{program.program_name}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              {program.start_year || '-'}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              {program.total_credits || '-'}
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-right">
                              {program.price_per_credit 
                                ? new Intl.NumberFormat('vi-VN').format(program.price_per_credit) + ' đ'
                                : '-'
                              }
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-right">
                              {typeof program.total_credits === 'number' && typeof program.price_per_credit === 'number'
                                ? new Intl.NumberFormat('vi-VN').format(program.total_credits * program.price_per_credit) + ' đ'
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Không có chương trình đào tạo nào
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
