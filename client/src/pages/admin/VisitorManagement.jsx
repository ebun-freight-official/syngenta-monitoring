import React, { useEffect, useState } from 'react'
import { FaFilter, FaPlus, FaSearch } from 'react-icons/fa'
import { IoClose } from 'react-icons/io5'
import {
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardArrowRight
} from 'react-icons/md'
import useGetAllUser from '../../hooks/useGetAllUser'
import clsx from 'clsx'
import UserDetailsModal from '../../components/modals/UserDetailsModal'
import { USER_STATUS_TYPES } from '../../utils/userOptions'
import DeleteUserModal from '../../components/modals/DeleteUserModal'
import {
  TableEmpty,
  TableError,
  TableLoading
} from '../../components/TablesState'
import { useUserContext } from '../../contexts/UserContext'
import PageHeader from '../../components/PageHeader'
import { getAvatarColor } from '../../utils/avatarColors'
import FilterDropdown from '../../components/ui/FilterDropdown'
import { SelectFilter } from '../../components/ui/FilterFields'
import CreateVisitorModal from '../../components/modals/CreateVisitorModal'

const defaultFilters = {
  role: 'visitor',
  status: '',
  sort: 'latest',
  search: '',
  perPage: 100,
  page: 1
}

/* ── Reusable user avatar ─────────────────────────────────────────────── */
function UserAvatar ({ user, size = 'sm' }) {
  const fullName = `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim()
  const initials = `${user.firstname?.[0] ?? ''}${
    user.lastname?.[0] ?? ''
  }`.toUpperCase()
  const avatarColor = getAvatarColor(fullName)

  const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]'

  if (user.imageUrl) {
    return (
      <img
        src={user.imageUrl}
        alt={fullName}
        className={clsx(
          sizeClass,
          'rounded-md object-cover object-center border border-gray-300'
        )}
      />
    )
  }

  return (
    <div
      className={clsx(
        sizeClass,
        'rounded-md flex items-center justify-center shrink-0',
        avatarColor.bg,
        avatarColor.border
      )}
    >
      <span
        className={clsx('font-bold leading-none', textSize, avatarColor.text)}
      >
        {initials}
      </span>
    </div>
  )
}

function VisitorManagement () {
  const { userData } = useUserContext()

  const [isVisitorDetailsModalOpen, setIsVisitorDetailsModalOpen] =
    useState(false)
  const [isDeleteVisitorModalOpen, setIsDeleteVisitorModalOpen] =
    useState(false)
  const [isCreateVisitorModalOpen, setIsCreateVisitorModalOpen] =
    useState(false)

  const { getAllUserFunction, isLoading } = useGetAllUser()
  const [allVisitors, setAllVisitors] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(null)
  const [totalPages, setTotalPages] = useState(null)
  const [error, setError] = useState(null)
  const [selectedVisitor, setSelectedVisitor] = useState({})

  const [filters, setFilters] = useState(defaultFilters)
  const [tempFilters, setTempFilters] = useState(defaultFilters)

  const handleChangeFilter = e => {
    const { name, value } = e.target
    setTempFilters(prev => ({ ...prev, [name]: value }))
  }

  useEffect(() => {
    if (tempFilters.search === '' && filters.search !== '') {
      const delaySearch = setTimeout(() => {
        setFilters(prev => ({ ...prev, search: '' }))
      }, 300)
      return () => clearTimeout(delaySearch)
    }
  }, [tempFilters.search, filters.search])

  const handleApplyFilters = e => {
    e.preventDefault()
    setFilters(tempFilters)
  }

  const handleResetFilters = () => {
    const isDefault = Object.keys(defaultFilters).every(
      key => tempFilters[key] === defaultFilters[key]
    )
    if (!isDefault) {
      setTempFilters(defaultFilters)
      setFilters(defaultFilters)
    }
  }

  const handleClearSearch = () => {
    setTempFilters(prev => ({ ...prev, search: '' }))
    setFilters(prev => ({ ...prev, search: '' }))
  }

  const handleChangePage = direction => {
    if (direction === 'prev' && filters.page > 1)
      setFilters(prev => ({ ...prev, page: prev.page - 1 }))
    else if (direction === 'next' && filters.page < totalPages)
      setFilters(prev => ({ ...prev, page: prev.page + 1 }))
  }

  const handleShowDVisitorDetailsModal = data => {
    setSelectedVisitor(data)
    setIsVisitorDetailsModalOpen(true)
  }

  const handleUpdateAllUsers = updatedUser => {
    setAllVisitors(prev =>
      prev.map(visitor =>
        visitor._id === updatedUser._id ? updatedUser : visitor
      )
    )
  }

  const handleRemoveDeletedUser = deletedUser => {
    setAllVisitors(prev => prev.filter(driver => driver._id !== deletedUser))
    setIsDeleteVisitorModalOpen(false)
    setIsVisitorDetailsModalOpen(false)
  }

  const handleAddNewVisitor = newVisitor => {
    setAllVisitors(prev => [newVisitor, ...prev])
  }

  useEffect(() => {
    const handleGetAllUsers = async () => {
      const { users, total, page, totalPages, error } =
        await getAllUserFunction(filters)
      if (error) setError(error)
      setAllVisitors(users)
      setTotal(total)
      setPage(page)
      setTotalPages(totalPages)
    }
    handleGetAllUsers()
  }, [filters])

  const btnBase =
    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed'

  const hasActiveFilters = Object.keys(defaultFilters).some(
    k =>
      !['sort', 'perPage', 'page', 'search'].includes(k) &&
      tempFilters[k] !== defaultFilters[k]
  )

  return (
    <>
      <div className='flex-1 flex flex-col gap-4 lg:gap-6'>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className='flex flex-wrap justify-between items-start gap-2'>
          <div className='flex justify-between flex-1 items-center md:items-start'>
            <PageHeader
              header={' Manage Visitors'}
              subheader={'View and manage all visitors in the system'}
            />

            {['head_admin'].includes(userData.data?.role) && (
              <div className='flex gap-2 xl:hidden'>
                <button
                  onClick={() => setIsCreateVisitorModalOpen(true)}
                  disabled={isLoading}
                  className={clsx(
                    btnBase,
                    'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                  )}
                >
                  <FaPlus className='text-xs' />
                  <span className='text-xs sm:text-sm'>Create New</span>
                </button>
              </div>
            )}
          </div>

          <div className='flex flex-wrap justify-between gap-2 w-full xl:w-auto'>
            {/* Search */}
            <form
              onSubmit={handleApplyFilters}
              className='flex flex-1 min-w-0 xl:w-64 items-center bg-white border border-gray-200 focus-within:border-gray-400 rounded-md px-3 py-2 gap-2  transition-all duration-200'
            >
              <FaSearch className='text-gray-400 text-xs shrink-0' />
              <input
                type='text'
                name='search'
                placeholder='Search visitors...'
                value={tempFilters.search}
                onChange={handleChangeFilter}
                autoComplete='off'
                className='w-full min-w-0 focus:outline-none text-xs sm:text-sm text-gray-700 placeholder-gray-400 bg-transparent'
              />
              <button
                type='button'
                onClick={handleClearSearch}
                className={clsx(
                  'rounded-full hover:bg-gray-100 cursor-pointer transition-all duration-200',
                  {
                    'opacity-100': tempFilters.search,
                    'opacity-0 pointer-events-none': !tempFilters.search
                  }
                )}
              >
                <IoClose className='text-base text-gray-400' />
              </button>
            </form>

            <div className='flex gap-2 max-sm:justify-between max-sm:w-full'>
              {/* Filter */}
              <FilterDropdown
                hasActiveFilters={hasActiveFilters}
                onReset={handleResetFilters}
                onApply={handleApplyFilters}
                isLoading={isLoading}
              >
                <SelectFilter
                  label='Sort'
                  name='sort'
                  value={tempFilters.sort}
                  onChange={handleChangeFilter}
                >
                  <option value='latest'>Latest</option>
                  <option value='oldest'>Oldest</option>
                  <option value='a-z'>A to Z</option>
                  <option value='z-a'>Z to A</option>
                </SelectFilter>

                <SelectFilter
                  label='Status'
                  name='status'
                  value={tempFilters.status}
                  onChange={handleChangeFilter}
                >
                  <option value=''>All</option>
                  {USER_STATUS_TYPES.map((status, index) => (
                    <option key={index} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </SelectFilter>
              </FilterDropdown>

              {/* Pagination */}
              <div className='flex items-center bg-white border border-gray-200 rounded-md overflow-hidden'>
                <button
                  onClick={() => handleChangePage('prev')}
                  disabled={isLoading || filters.page === 1}
                  className='p-2 py-1 text-xl hover:bg-gray-50 cursor-pointer border-r border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors'
                >
                  <MdOutlineKeyboardArrowLeft />
                </button>
                <p className='text-xs text-gray-600 sm:min-w-24 text-center px-2'>
                  {!isLoading &&
                    allVisitors &&
                    `Page ${total > 0 ? page : 0} of ${totalPages}`}
                </p>
                <button
                  onClick={() => handleChangePage('next')}
                  disabled={isLoading || filters.page === totalPages}
                  className='p-2 py-1 text-xl hover:bg-gray-50 cursor-pointer border-l border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors'
                >
                  <MdOutlineKeyboardArrowRight />
                </button>
              </div>

              {/* xl Create */}
              {['head_admin'].includes(userData.data?.role) && (
                <button
                  onClick={() => setIsCreateVisitorModalOpen(true)}
                  disabled={isLoading}
                  className={clsx(
                    btnBase,
                    'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 max-xl:hidden'
                  )}
                >
                  <FaPlus className='text-xs' />
                  <span>Create New</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Table / States ──────────────────────────────────────────────── */}
        {isLoading ? (
          <TableLoading />
        ) : error ? (
          <TableError />
        ) : !allVisitors || allVisitors.length === 0 ? (
          <TableEmpty />
        ) : (
          <div className='relative flex-1 overflow-y-auto scrollbar-thin bg-white'>
            <div className='absolute inset-0'>
              <table className='table text-xs sm:table-sm table-pin-rows table-pin-cols border-collapse'>
                <thead>
                  <tr className='bg-gray-50 border-b border-gray-200 text-gray-500 max-md:text-xxs text-xs uppercase tracking-wide'>
                    <td>{total}</td>
                    <td>Image</td>
                    <td>Fullname</td>
                    <td>Email</td>
                    <td>Phone No.</td>
                    <td>Role</td>
                    <td>Status</td>
                    <td>Login Count</td>
                  </tr>
                </thead>
                <tbody>
                  {allVisitors.map((visitor, index) => (
                    <tr
                      key={index}
                      onClick={() => handleShowDVisitorDetailsModal(visitor)}
                      className='border-b border-gray-100 last:border-none hover:bg-gray-50 cursor-pointer capitalize align-middle transition-colors text-gray-600'
                    >
                      <td className='text-xxs sm:text-xs font-semibold text-gray-400'>
                        {(page - 1) * filters.perPage + index + 1}
                      </td>
                      <td className='py-1.5'>
                        <UserAvatar user={visitor} size='sm' />
                      </td>
                      <td>
                        <p className='max-sm:text-xxs text-nowrap capitalize'>
                          {`${visitor.firstname} ${visitor.lastname}`}
                        </p>
                      </td>
                      <td className='max-sm:text-xxs lowercase'>
                        {visitor.email}
                      </td>
                      <td className='max-sm:text-xxs'>{visitor.phoneNo}</td>
                      <td className='capitalize max-sm:text-xxs'>
                        {visitor.role}
                      </td>
                      <td>
                        <div
                          className={clsx(
                            'px-2.5 py-1 rounded-full w-fit text-xxs xs:text-xs',
                            {
                              'bg-orange-50 text-orange-500':
                                visitor.status === 'pending',
                              'bg-gray-100 text-gray-500':
                                visitor.status === 'rejected' ||
                                visitor.status === 'revoked',
                              'bg-emerald-50 text-emerald-600':
                                visitor.status === 'active',
                              'bg-red-50 text-red-500':
                                visitor.status === 'inactive'
                            }
                          )}
                        >
                          {visitor.status}
                        </div>
                      </td>
                      <td className='max-sm:text-xxs'>{visitor.loginCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <UserDetailsModal
        isOpen={isVisitorDetailsModalOpen}
        onClose={() => setIsVisitorDetailsModalOpen(false)}
        user={selectedVisitor}
        onUpdate={handleUpdateAllUsers}
        openDeleteModal={() => setIsDeleteVisitorModalOpen(true)}
        currentUser={userData.data}
      />
      <CreateVisitorModal
        isOpen={isCreateVisitorModalOpen}
        onClose={() => setIsCreateVisitorModalOpen(false)}
        onCreate={handleAddNewVisitor}
      />
      <DeleteUserModal
        isOpen={isDeleteVisitorModalOpen}
        onClose={() => setIsDeleteVisitorModalOpen(false)}
        user={selectedVisitor}
        onDelete={handleRemoveDeletedUser}
      />
    </>
  )
}

export default VisitorManagement
